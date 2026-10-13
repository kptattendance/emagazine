import { getAuth } from "@clerk/express";

const requireAuth = (req, res, next) => {
  const { isAuthenticated, userId } = getAuth(req);

  if (!isAuthenticated || !userId) {
    // Clerk records why it rejected the login on the response
    const reason =
      res.getHeader("x-clerk-auth-reason") || "unknown";

    console.warn(
      `AUTH REJECTED: ${req.method} ${req.originalUrl} (${reason})`
    );

    return res.status(401).json({
      success: false,
      message: `Authentication required (${reason})`,
      reason,
    });
  }

  req.clerkUserId = userId;

  next();
};

export default requireAuth;
