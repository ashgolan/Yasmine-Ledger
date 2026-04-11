export const notFound = (req, res) => {
  res.status(404).json({
    message: "הנתיב המבוקש לא נמצא.",
  });
};

export const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    message: err.message || "שגיאה פנימית בשרת.",
  });
};