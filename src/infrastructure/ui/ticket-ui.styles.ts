export const ticketUiStyles = `
  :root {
    font-family:
      Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
      "Segoe UI", sans-serif;
    color: #172033;
    background: #f4f7fb;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    background: #f4f7fb;
  }

  a {
    color: #315efb;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  .page-header {
    background: #172033;
    color: white;
    padding: 18px 32px;
  }

  .page-header h1 {
    margin: 0;
    font-size: 22px;
  }

  .page-container {
    width: min(1100px, calc(100% - 32px));
    margin: 32px auto;
  }

  .card {
    background: white;
    border: 1px solid #dfe5ef;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 6px 18px rgb(23 32 51 / 8%);
  }

  .page-title {
    margin-top: 0;
    margin-bottom: 8px;
  }

  .page-description {
    margin-top: 0;
    color: #667085;
  }

  .table-wrapper {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 24px;
  }

  th,
  td {
    padding: 14px 16px;
    text-align: left;
    border-bottom: 1px solid #e8ecf3;
  }

  th {
    background: #f8fafc;
    color: #475467;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  tbody tr:hover {
    background: #f8faff;
  }

  .ticket-link {
    font-weight: 700;
  }

  .badge {
    display: inline-block;
    padding: 5px 9px;
    border-radius: 999px;
    background: #eef2ff;
    color: #3446a8;
    font-size: 12px;
    font-weight: 700;
  }

  .details-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    margin: 24px 0;
  }

  .detail-item {
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;
  }

  .detail-label {
    display: block;
    margin-bottom: 6px;
    color: #667085;
    font-size: 13px;
  }

  .detail-value {
    font-weight: 600;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
    margin-top: 24px;
  }

  label {
    display: block;
    margin-bottom: 7px;
    font-weight: 600;
  }

  select {
    width: 100%;
    padding: 11px 12px;
    border: 1px solid #cfd7e6;
    border-radius: 8px;
    background: white;
    font: inherit;
  }

  select:focus {
    outline: 3px solid rgb(49 94 251 / 15%);
    border-color: #315efb;
  }

  .button-row {
    margin-top: 24px;
  }

  button {
    border: 0;
    border-radius: 8px;
    padding: 11px 18px;
    background: #315efb;
    color: white;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  button:hover {
    background: #2549ca;
  }

  .back-link {
    display: inline-block;
    margin-bottom: 20px;
  }

  @media (max-width: 760px) {
    .details-grid,
    .form-grid {
      grid-template-columns: 1fr;
    }

    .page-header {
      padding: 16px;
    }

    .page-container {
      width: min(100% - 20px, 1100px);
      margin: 20px auto;
    }
  }
`;
