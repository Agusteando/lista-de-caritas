feat: show instant attendance proof modal with connection status

- Open the attendance proof modal immediately after tapping Guardar pase de lista, before the backend request resolves.
- Show live internet status inside the modal, including an immediate offline warning when the browser reports no connection.
- Keep the modal in a pending/loading state while the server confirms the attendance register, then update it in place with confirmation time.
- Preserve the 10-second close lock, official branding, attendance stats, folio, and screenshot instruction.
