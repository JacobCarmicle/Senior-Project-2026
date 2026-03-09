import {
  createListing,
  getListing,
  listListings,
  updateListing,
} from "./listings";

describe("listings API service", () => {
  it("creates listing", async () => {
    localStorage.setItem("access_token", "mock-jwt-token-abc123");
    const res = await createListing({
      title: "Desk lamp",
      description: "Bright desk lamp",
      price: 20,
      category: "home",
      location: "Wichita, KS",
      images: ["https://img.test/lamp.jpg"],
    });
    expect(res.id).toBeDefined();
    expect(res.title).toBe("Desk lamp");
  });

  it("gets listing by id", async () => {
    const res = await getListing("l1");
    expect(res.id).toBe("l1");
  });

  it("updates listing", async () => {
    localStorage.setItem("access_token", "mock-jwt-token-abc123");
    const res = await updateListing("l1", { title: "Updated" });
    expect(res.title).toBe("Updated");
  });

  it("lists listings", async () => {
    const res = await listListings();
    expect(res.items).toBeDefined();
  });
});
