const CommentsService = require("../../../src/services/comments");

let mockCommentsRepository = {
  createComment: jest.fn(),
  findAllComments: jest.fn(),
  findOneComment: jest.fn(),
  updateComment: jest.fn(),
  deleteComment: jest.fn(),
};

describe("Comments Service Unit Test", () => {

});