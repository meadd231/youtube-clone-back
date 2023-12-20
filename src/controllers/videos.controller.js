const { Video, User, VideoLike } = require("../sequelize");

const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const redis = require("../redis");
const path = require("path");

class VideosController {
  constructor() {
    this.storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, "../uploads/videos");
      },
      filename: (req, file, cb) => {
        file.originalname = Buffer.from(file.originalname, "latin1").toString(
          "utf8"
        );
        cb(null, `${Date.now()}_${file.originalname}`);
      },
      fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        if (ext !== ".mp4") {
          return cb(
            res.status(400).end("only jpg, png, mp4 is allowed"),
            false
          );
        }
        cb(null, true);
      },
    });
    this.upload = multer({ storage: this.storage }).single("file");
    this.thumbnailStorage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, "../uploads/thumbnails"); // 파일이 저장될 폴더 지정
      },
      filename: (req, file, cb) => {
        file.originalname = Buffer.from(file.originalname, "latin1").toString(
          "utf8"
        );
        cb(null, `${Date.now()}_${file.originalname}`);
      },
    });
    this.thumbnailUpload = multer({ storage: this.thumbnailStorage });
  }

  uploadVideo = (req, res) => {
    try {
      this.upload(req, res, (err) => {
        if (err) {
          return res.json({ success: false, err });
        }
        return res.json({
          success: true,
          filePath: res.req.file.path,
          fileName: res.req.file.filename,
        });
      });
    } catch (error) {
      console.error(error);
    }
  };

  postThumbnail = (req, res) => {
    try {
      let thumbsFilePath = "";
      let thumbsFilePaths = "";
      let fileDuration = "";

      ffmpeg.ffprobe(req.body.filePath, function (err, metadata) {
        console.dir(metadata);
        console.log(metadata.format.duration);

        fileDuration = metadata.format.duration;
      });

      ffmpeg(req.body.filePath)
        .on("filenames", function (filenames) {
          console.log("Will generate " + filenames.join(", "));

          thumbsFilePath = filenames[0];
          thumbsFilePaths = filenames.join(",");
        })
        .on("end", function () {
          // ffmpeg의 동작이 끝날 때 end라는 이벤트가 호출되고 그 때 호출될 콜백 함수라는 것 같음.
          console.log("Screenshots taken");
          return res.json({
            success: true,
            thumbsFilePath,
            thumbsFilePaths,
            fileDuration: fileDuration,
          });
        })
        .screenshots({
          // Will take screens at 20%, 40%, 60% and 80% of the video
          count: 3,
          folder: "../uploads/thumbnails",
          size: "320x240",
          // %b input basename ( filename w/o extension )
          filename: "thumbnail-%b.png",
        });
    } catch (error) {
      console.error(error);
    }
  };

  postCustomThumbnail = async (req, res) => {
    try {
      console.log("File received:", req.file);
      const uploadedFileName = req.file.filename;
      res.status(201).json({ success: true, uploadedFileName });
    } catch (error) {
      console.error(error);
    }
  };

  // postgres에 video 데이터 저장
  postVideo = async (req, res) => {
    try {
      const video = new Video(req.body);
      console.log("req.body", req.body);
      console.log("video", video);

      video.save((err, video) => {
        if (err) return res.status(400).json({ success: false, err });
        return res.status(200).json({
          success: true,
        });
      });
    } catch (error) {
      console.error(error);
    }
  };

  getVideos = async (req, res) => {
    try {
      const videos = await Video.findAll({
        include: [
          { model: User, attributes: ["nickname", "avatar"], as: "author" },
        ],
      });
      res.status(200).json({ videos });
    } catch (error) {
      console.error(error);
    }
  };

  getChannelVideos = async (req, res) => {
    try {
      const { channel_id, video_order } = req.query;
      console.log("video_order type", typeof video_order);
      const int_video_order = Number(video_order);
      // 최신순, 인기순, 날짜순
      const orderOptions = [
        ["createdAt", "DESC"],
        ["views", "DESC"],
        ["createdAt", "ASC"],
      ];
      const channelVideos = await Video.findAll({
        where: { writer: channel_id },
        include: [
          { model: User, attributes: ["nickname", "avatar"], as: "author" },
        ],
        order: [orderOptions[int_video_order]],
      });
      res.status(200).json({ success: true, channelVideos });
    } catch (error) {
      console.error(error);
    }
  };

  // 조회수 올리기 - 현재 client의 ip를 바탕으로 진행 중이지만 추후 개선 예정
  getVideo = async (req, res) => {
    try {
      const { videoId } = req.params;
      const clientIp = req.ip;
      console.log("clientIp", req.ip);
      const video = await Video.findOne({
        where: { id: videoId },
        include: [
          {
            model: User,
            attributes: ["nickname", "avatar", "subscribeNum"],
            as: "author",
          },
        ],
      });
      const success = await this.increaseViewCount(clientIp, video);
      res.status(200).json({ success: true, video });
    } catch (error) {
      console.error(error);
    }
  };

  increaseViewCount = async (clientIp, video) => {
    const key = `clent-ip:${clientIp}:video:${video.id}:views`;

    // Redis에서 TTL 확인
    const ttl = await redis.ttl(key);

    if (ttl > 0) {
      console.log(`조회수 증가가 ${ttl}초 동안 막혔습니다.`);
      return false; // 조회수 증가 막힘
    } else {
      const cooldownTime = 15 * 60; // 15분
      video.views++; // 조회수 1 증가
      await video.save();

      await redis.set(key, 1);

      // TTL 설정 (15분 동안)
      await redis.expire(key, cooldownTime);

      console.log(`조회수 증가: ${video.views}`);
      return true; // 조회수 증가 성공
    }
  };

  // 좋아요 api
  // 경우의 수 6개
  postVideoLike = async (req, res) => {
    try {
      const { videoId } = req.params;
      const { id } = req.body.user;
      const { type } = req.body;

      const video = await Video.findOne({ where: { id: videoId } });
      const videoLike = await VideoLike.findOne({ videoId, userId: id });
      let liked = false;
      let disliked = false;

      if (type == "like") {
        if (!videoLike) {
          await VideoLike.create({ userId: id, videoId, type });
          video.likes++;
          liked = true;
        } else if (videoLike.type == "like") {
          await VideoLike.destroy({ where: { userId: id, videoId } });
          video.likes--;
        } else if (videoLike.type == "dislike") {
          await VideoLike.destroy({ where: { userId: id, videoId } });
          video.dislike--;
          await VideoLike.create({ userId: id, videoId, type });
          video.likes++;
          liked = true;
        }
      } else if (type == "dislike") {
        if (!videoLike) {
          await VideoLike.create({ userId: id, videoId, type });
          video.dislike++;
          disliked = true;
        } else if (videoLike.type == "like") {
          await VideoLike.destroy({ where: { userId: id, videoId } });
          video.likes--;
          await VideoLike.create({ userId: id, videoId, type });
          video.dislike++;
          disliked = true;
        } else if (videoLike.type == "dislike") {
          await VideoLike.destroy({ where: { userId: id, videoId } });
          video.dislike--;
        }
      }
      await video.save();

      res
        .status(201)
        .json({ success: true, likes: video.likes, liked, disliked });
    } catch (error) {
      console.error(error);
    }
  };

  // 비디오 좋아요 데이터 api
  // 로그인 안 되면 프론트에서 막음.
  getVideoLikeData = async (req, res) => {
    try {
      const { videoId } = req.params;
      const { user } = req.locals;

      // 나의 videolike가 존재하는지 검색
      const videolike = await VideoLike.findOne({
        where: { userId: user.id, videoId },
      });
      let liked = false;
      if (videolike) {
        liked = true;
      }

      // likes 가져오기.
      const video = await Video.findOne({ videoId });
      const likes = video.likes;

      return res.status(200).json({ success: true, liked, likes });
    } catch (error) {
      console.error(error);
    }
  };
}

module.exports = VideosController;
