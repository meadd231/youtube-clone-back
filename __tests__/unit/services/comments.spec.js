const CommentsService = require("../../../src/services/comments");

let mockCommentsModel = {
  createComment: jest.fn(),
  findAllComments: jest.fn(),
  findOneComment: jest.fn(),
  updateComment: jest.fn(),
  deleteComment: jest.fn(),
};

describe("Comments Service Unit Test", () => {
  beforeEach(() => {
    jest.resetAllMocks(); // 모든 Mock을 초기화합니다.
  });

  test("Comments Service createComment Method", async () => {
    
  });
});