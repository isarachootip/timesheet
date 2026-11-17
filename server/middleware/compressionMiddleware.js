import zlib from 'zlib';

const MIN_COMPRESS_BYTES = 1024;

export const gzipJsonMiddleware = (req, res, next) => {
  const acceptEncoding = String(req?.headers?.['accept-encoding'] || '');
  if (!acceptEncoding.includes('gzip')) {
    return next();
  }

  const originalJson = res.json.bind(res);

  res.json = (body) => {
    if (res.getHeader('Content-Encoding')) {
      return originalJson(body);
    }

    const rawJson = JSON.stringify(body);
    if (!rawJson || Buffer.byteLength(rawJson, 'utf8') < MIN_COMPRESS_BYTES) {
      return originalJson(body);
    }

    const compressed = zlib.gzipSync(rawJson, { level: zlib.constants.Z_BEST_SPEED });
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Vary', 'Accept-Encoding');
    return res.send(compressed);
  };

  return next();
};
