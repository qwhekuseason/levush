import app from '../server/src/app.js';

export default function handler(req, res) {
  return new Promise((resolve, reject) => {
    app(req, res, (err) => {
      if (err) reject(err);
      else resolve(undefined);
    });
  });
}
