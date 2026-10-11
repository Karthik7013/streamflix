import { describe, it, expect } from "vitest";
import { toAdminUser } from "@/hooks/use-admin-users";

describe("toAdminUser", () => {
  it("maps a full better-auth row to the admin User shape", () => {
    expect(
      toAdminUser({
        id: "1",
        name: "Ada",
        email: "ada@x.com",
        emailVerified: true,
        image: null,
        role: "admin",
        banned: false,
        banReason: null,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      })
    ).toEqual({
      id: "1",
      name: "Ada",
      email: "ada@x.com",
      emailVerified: true,
      image: null,
      role: "admin",
      banned: false,
      banReason: null,
      createdAt: "2024-01-01T00:00:00.000Z",
    });
  });

  it("fills defaults for optional better-auth fields", () => {
    const user = toAdminUser({
      id: "2",
      name: "Bo",
      email: "bo@x.com",
      emailVerified: false,
      createdAt: "2024-02-01",
    });

    expect(user.role).toBe("user");
    expect(user.banned).toBeNull();
    expect(user.banReason).toBeNull();
    expect(user.image).toBeNull();
  });
});
