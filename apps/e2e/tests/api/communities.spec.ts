import { expect, test } from "../../fixtures";
import { SIGNED_OUT } from "../../support/paths";

// Only requests that create nothing: the shared account must stay without a community.
// Founding itself is covered through the interface in tests/communities/create.spec.ts.
test.describe("POST /api/communities", () => {
  test("odrzuca niepoprawne dane z kodem 400", async ({ request }) => {
    const response = await request.post("/api/communities", {
      data: {
        name: "",
        address: "ul. Testowa 7",
        building: { name: "Testowa 7", staircases: ["A", "A"] },
      },
    });

    expect(response.status()).toBe(400);
  });

  test.describe("bez sesji", () => {
    test.use({ storageState: SIGNED_OUT });

    test("odmawia z kodem 401", async ({ request }) => {
      const response = await request.post("/api/communities", {
        data: { name: "Wspólnota Testowa", address: "ul. Testowa 7" },
      });

      expect(response.status()).toBe(401);
      expect(await response.json()).toMatchObject({ code: "UNAUTHORIZED" });
    });
  });
});
