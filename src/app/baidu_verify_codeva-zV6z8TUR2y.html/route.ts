export function GET() {
  return new Response("fe800bcbd42b382383f1088ddb828beb", {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
