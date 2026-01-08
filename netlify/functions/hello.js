export default async () => {
  return new Response("hello from netlify functions", {
    headers: { "Content-Type": "text/plain" },
  });
};
