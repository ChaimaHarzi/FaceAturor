// Runs before AppModule is imported: real environment variables win over .env,
// so the tests never touch the developer's database, mailbox or Cloudinary.
process.env.MONGO_CONNECTION_STRING = 'mongodb://127.0.0.1:1/placeholder';
process.env.JWT_SECRET = 'e2e-secret';
process.env.EMAIL_USERNAME = '';
process.env.EMAIL_PASSWORD = '';
process.env.CLOUDINARY_CLOUD_NAME = '';
process.env.CLOUDINARY_API_KEY = '';
process.env.CLOUDINARY_API_SECRET = '';
