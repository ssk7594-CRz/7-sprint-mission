// routes/profile.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;

// 사용자별 폴더 생성
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const userId = req.user?.id || "anonymous";
    const uploadPath = path.join("uploads", "profiles", userId.toString());

    // 폴더가 없으면 생성
    await fs.mkdir(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // 프로필 사진은 하나만: profile + 타임스탬프 + 확장자
    const ext = path.extname(file.originalname);
    cb(null, `profile-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: function (req, file, cb) {
    // 이미지 파일만 허용
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(
        new Error("이미지 파일만 업로드 가능합니다 (jpeg, jpg, png, gif, webp)")
      );
    }
  },
});

// 프로필 이미지 업로드
router.post(
  "/upload",
  upload.single("profileImage"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "파일이 업로드되지 않았습니다" });
      }

      // 이전 프로필 이미지 삭제 (있다면)
      const userId = req.user?.id || "anonymous";
      const uploadDir = path.join("uploads", "profiles", userId.toString());
      const files = await fs.readdir(uploadDir);

      for (const file of files) {
        if (file !== path.basename(req.file.path)) {
          await fs.unlink(path.join(uploadDir, file));
        }
      }

      res.json({
        message: "프로필 이미지 업로드 성공",
        file: {
          filename: req.file.filename,
          path: req.file.path,
          size: req.file.size,
          url: `/uploads/profiles/${userId}/${req.file.filename}`,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// 프로필 이미지 조회
router.get("/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const uploadDir = path.join("uploads", "profiles", userId);

    const files = await fs.readdir(uploadDir);
    const profileImage = files.find((file) => file.startsWith("profile-"));

    if (!profileImage) {
      return res
        .status(404)
        .json({ error: "프로필 이미지를 찾을 수 없습니다" });
    }

    res.json({
      url: `/uploads/profiles/${userId}/${profileImage}`,
    });
  } catch (err) {
    if (err.code === "ENOENT") {
      return res
        .status(404)
        .json({ error: "프로필 이미지를 찾을 수 없습니다" });
    }
    next(err);
  }
});

module.exports = router;
