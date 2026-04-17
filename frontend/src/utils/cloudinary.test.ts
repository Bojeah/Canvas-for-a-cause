import {
  buildArtworkImageUrl,
  buildArtworkThumbnailUrl,
  isCloudinaryDeliveryUrl,
} from "./cloudinary";

describe("cloudinary helpers", () => {
  it("adds transformations to valid Cloudinary upload urls", () => {
    const sourceUrl =
      "https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg";

    expect(buildArtworkImageUrl(sourceUrl)).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_1200/v1234567890/sample.jpg",
    );
    expect(buildArtworkThumbnailUrl(sourceUrl)).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_fill,g_auto,w_400,h_400/v1234567890/sample.jpg",
    );
  });

  it("leaves already transformed Cloudinary urls unchanged", () => {
    const sourceUrl =
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_1200/v1234567890/sample.jpg";

    expect(buildArtworkImageUrl(sourceUrl)).toBe(sourceUrl);
  });

  it("rejects non-secure or non-upload urls", () => {
    expect(
      isCloudinaryDeliveryUrl(
        "http://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg",
      ),
    ).toBe(false);
    expect(
      isCloudinaryDeliveryUrl(
        "https://example.com/image/upload/v1234567890/sample.jpg",
      ),
    ).toBe(false);
  });
});
