export default async function authRoutes(fastify) {
  // Fixed test credentials (no signup)
  fastify.post("/auth/login", async (request, reply) => {
    const { email, password } = request.body || {};

    const isValid =
      email === "test@gmail.com" && password === "test@123";

    if (!isValid) {
      return reply.code(401).send({ message: "Invalid credentials" });
    }

    return reply.send({
      message: "Login successful",
      user: {
        email,
      },
    });
  });
}
