describe('Document API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches documents successfully', async () => {
    const mockDocuments = [
      { id: '1', title: 'Doc 1', content: 'Content 1' },
      { id: '2', title: 'Doc 2', content: 'Content 2' },
    ]

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockDocuments),
      })
    ) as jest.Mock

    const response = await fetch('/api/documents')
    const data = await response.json()

    expect(data).toEqual(mockDocuments)
    expect(fetch).toHaveBeenCalledWith('/api/documents')
  })

  it('handles fetch error', async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('Network error'))
    ) as jest.Mock

    await expect(fetch('/api/documents')).rejects.toThrow('Network error')
  })

  it('creates document successfully', async () => {
    const newDocument = { title: 'New Doc', content: 'New Content' }
    const mockResponse = { id: '3', ...newDocument }

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    ) as jest.Mock

    const response = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDocument),
    })
    const data = await response.json()

    expect(data).toEqual(mockResponse)
  })
})