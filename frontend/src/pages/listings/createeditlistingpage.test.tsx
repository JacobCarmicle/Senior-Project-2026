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
  });

  it("shows validation for unsupported file type", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateEditListingPage />, { route: "/create-listing" });

    await fillRequiredFields(user);

    const badFile = new File(["txt"], "note.txt", { type: "text/plain" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [badFile] } });

    expect(await screen.findByText(/only png, jpg, and webp images are allowed/i)).toBeInTheDocument();
  });
});
