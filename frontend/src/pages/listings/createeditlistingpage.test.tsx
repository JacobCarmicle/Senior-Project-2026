import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/helpers";
import CreateEditListingPage from "./createeditlistingpage";
import * as listingsApi from "../../api/listings";

vi.mock("../../api/listings", async () => {
  const actual = await vi.importActual<typeof import("../../api/listings")>("../../api/listings");
  return {
    ...actual,
    uploadListingImages: vi.fn(),
    createListing: vi.fn(),
    getListing: vi.fn(),
    updateListing: vi.fn(),
  };
});

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText(/iphone 13/i), "Gaming Keyboard");
  await user.type(screen.getByPlaceholderText(/describe your item/i), "Good condition keyboard with RGB");
  await user.type(screen.getByPlaceholderText("0.00"), "85");
  await user.selectOptions(screen.getByDisplayValue("Select a category"), "Electronics");
  await user.selectOptions(screen.getByDisplayValue("Select condition"), "Like New");
  await user.type(screen.getByPlaceholderText(/Bowling Green/i), "Wichita, KS");
}

describe("CreateEditListingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listingsApi.getListing).mockResolvedValue({
      id: "l1",
      seller_id: "u1",
      title: "Existing listing",
      description: "Existing listing description",
      price: 50,
      category: "Electronics",
      location: "Wichita, KS",
      status: "active",
      images: ["https://img.test/existing.jpg"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  it("uploads images and then submits listing payload", async () => {
    const user = userEvent.setup();
    localStorage.setItem("access_token", "mock-jwt-token-abc123");

    vi.mocked(listingsApi.uploadListingImages).mockResolvedValue([
      { public_url: "https://img.test/upload-1.jpg", object_key: "u1/upload-1.jpg" },
    ]);
    vi.mocked(listingsApi.createListing).mockResolvedValue({
      id: "l1",
      seller_id: "u1",
      title: "Gaming Keyboard",
      description: "Good condition keyboard with RGB",
      price: 85,
      category: "Electronics",
      location: "Wichita, KS",
      status: "active",
      images: ["https://img.test/upload-1.jpg"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    renderWithProviders(<CreateEditListingPage />, { route: "/create-listing" });
    await screen.findByTitle("Test User");
    await fillRequiredFields(user);

    const file = new File(["img-bytes"], "keyboard.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await user.click(screen.getByRole("button", { name: /create listing/i }));

    await waitFor(() => {
      expect(listingsApi.uploadListingImages).toHaveBeenCalledTimes(1);
      expect(listingsApi.createListing).toHaveBeenCalledWith({
        title: "Gaming Keyboard",
        description: "Good condition keyboard with RGB",
        price: 85,
        category: "Electronics",
        location: "Wichita, KS",
        images: ["https://img.test/upload-1.jpg"],
      });
    });
  }, 15000);

  it("loads listing in edit mode and submits update", async () => {
    const user = userEvent.setup();
    localStorage.setItem("access_token", "mock-jwt-token-abc123");

    vi.mocked(listingsApi.uploadListingImages).mockResolvedValue([]);
    vi.mocked(listingsApi.updateListing).mockResolvedValue({
      id: "l1",
      seller_id: "u1",
      title: "Updated title",
      description: "Existing listing description",
      price: 50,
      category: "Electronics",
      location: "Wichita, KS",
      status: "active",
      images: ["https://img.test/existing.jpg"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    renderWithProviders(<CreateEditListingPage listingId="l1" />, { route: "/edit-listing/l1" });

    expect(await screen.findByDisplayValue("Existing listing")).toBeInTheDocument();

    const titleInput = screen.getByDisplayValue("Existing listing");
    await user.clear(titleInput);
    await user.type(titleInput, "Updated title");

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(listingsApi.updateListing).toHaveBeenCalledTimes(1);
      const [, payload] = vi.mocked(listingsApi.updateListing).mock.calls[0];
      expect(payload.title).toContain("Updated title");
    });
  }, 15000);

  it("shows validation for unsupported file type", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateEditListingPage />, { route: "/create-listing" });

    await fillRequiredFields(user);

    const badFile = new File(["txt"], "note.txt", { type: "text/plain" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [badFile] } });

    expect(await screen.findByText(/only png, jpg, and webp images are allowed/i)).toBeInTheDocument();
  }, 15000);

  it("fills meetup location when current location is used", async () => {
    const user = userEvent.setup();
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success({
        coords: {
          latitude: 37.6872,
          longitude: -97.3301,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON: () => ({}),
        },
        timestamp: Date.now(),
        toJSON: () => ({}),
      } as GeolocationPosition);
    });

    Object.defineProperty(globalThis.navigator, "geolocation", {
      value: { getCurrentPosition },
      configurable: true,
    });

    renderWithProviders(<CreateEditListingPage />, { route: "/create-listing" });

    await user.click(screen.getByRole("button", { name: /use current location/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/bowling green/i)).toHaveValue("Wichita, KS");
    });
  });

  it("shows location error when permission is denied", async () => {
    const user = userEvent.setup();
    const getCurrentPosition = vi.fn((_success: PositionCallback, error?: PositionErrorCallback) => {
      error?.({
        code: 1,
        message: "Denied",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError);
    });

    Object.defineProperty(globalThis.navigator, "geolocation", {
      value: { getCurrentPosition },
      configurable: true,
    });

    renderWithProviders(<CreateEditListingPage />, { route: "/create-listing" });

    await user.click(screen.getByRole("button", { name: /use current location/i }));

    expect(await screen.findByText(/unable to access your location/i)).toBeInTheDocument();
  });
});
