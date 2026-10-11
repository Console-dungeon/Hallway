import { expect, test } from "../../fixtures";
import { SHARED_USER_NAME } from "../../support/accounts";
import { SIGNED_OUT } from "../../support/paths";

// API tests use `request`, which carries the same session as the browser would.
test.describe("GET /api/me", () => {
  test("zwraca zalogowaną osobę z jej wspólnotami i lokalami", async ({
    request,
  }) => {
    const response = await request.get("/api/me");

    expect(response.status()).toBe(200);
    const me = await response.json();
    expect(me.user).toMatchObject({ name: SHARED_USER_NAME, role: "user" });
    expect(me.user.id).toMatch(/^user_/);
    // A fresh account belongs to nothing yet
    expect(me.communities).toEqual([]);
    expect(me.units).toEqual([]);
  });

  test.describe("bez sesji", () => {
    test.use({ storageState: SIGNED_OUT });

    test("odmawia z kodem 401", async ({ request }) => {
      const response = await request.get("/api/me");

      expect(response.status()).toBe(401);
      expect(await response.json()).toMatchObject({ code: "UNAUTHORIZED" });
    });
  });
});
