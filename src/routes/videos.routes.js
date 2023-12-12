const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");
const VideosController = require("../controllers/videos.controller");
const videosController = new VideosController();


router.post("/upload-video-file", videosController.uploadVideo);

router.post("/thumbnail", videosController.postThumbnail);

// 프로필 이미지 수정
router.post("/custom-thumbnail", videosController.thumbnailUpload.single("file"), videosController.postCustomThumbnail);

router.post("/video", videosController.postVideo);

router.get("/", videosController.getVideos);

router.get("/:videoId", videosController.getVideo);

router.post("/:videoId/like", auth, videosController.postVideoLike);

router.get("/:videoId/likedata", auth, videosController.getVideoLikeData);

module.exports = router;
