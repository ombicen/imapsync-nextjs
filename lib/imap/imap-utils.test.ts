import { emptyMailbox, getMailboxList } from "./imap-utils";

describe("emptyMailbox", () => {
  it("should empty a mailbox by calling the correct IMAP commands", async () => {
    // Mock IMAP client
    const mockClient = {
      search: jest.fn().mockResolvedValue([1, 2, 3]),
      messageDelete: jest.fn().mockResolvedValue(true),
      mailboxOpen: jest.fn().mockResolvedValue(true),
      expunge: jest.fn().mockResolvedValue(true),
    };

    // Call the function
    await emptyMailbox(mockClient as any, "INBOX");

    // Check that the correct methods were called
    expect(mockClient.mailboxOpen).toHaveBeenCalledWith("INBOX");
    expect(mockClient.search).toHaveBeenCalledWith({ all: true });
    expect(mockClient.messageDelete).toHaveBeenCalledWith([1, 2, 3]);
    expect(mockClient.expunge).toHaveBeenCalled();
  });

  it("should handle empty mailbox gracefully", async () => {
    const mockClient = {
      search: jest.fn().mockResolvedValue([]),
      messageDelete: jest.fn(),
      mailboxOpen: jest.fn().mockResolvedValue(true),
      expunge: jest.fn(),
    };
    await emptyMailbox(mockClient as any, "INBOX");
    expect(mockClient.mailboxOpen).toHaveBeenCalledWith("INBOX");
    expect(mockClient.search).toHaveBeenCalledWith({ all: true });
    expect(mockClient.messageDelete).not.toHaveBeenCalled();
    expect(mockClient.expunge).not.toHaveBeenCalled();
  });
});

describe("getMailboxList", () => {
  it("should return a list of mailboxes from the IMAP client", async () => {
    const mockMailboxes = [
      { path: "INBOX", name: "INBOX", delimiter: "/" },
      { path: "Sent", name: "Sent", delimiter: "/" },
    ];
    const mockClient = {
      list: jest.fn().mockResolvedValue(mockMailboxes),
    };
    const result = await getMailboxList(mockClient as any);
    expect(mockClient.list).toHaveBeenCalled();
    expect(result).toEqual(mockMailboxes);
  });

  it("should handle empty mailbox list", async () => {
    const mockClient = {
      list: jest.fn().mockResolvedValue([]),
    };
    const result = await getMailboxList(mockClient as any);
    expect(result).toEqual([]);
  });

  it("should throw if IMAP client fails", async () => {
    const mockClient = {
      list: jest.fn().mockRejectedValue(new Error("IMAP error")),
    };
    await expect(getMailboxList(mockClient as any)).rejects.toThrow(
      "IMAP error"
    );
  });
});
