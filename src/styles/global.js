export const CSS = `
  :root {
    --bg:#fff; --bg2:#f5f5f4; --text:#1a1a1a; --text2:#6b7280;
    --border:#e5e7eb; --border2:#d1d5db;
    --success-bg:#dcfce7; --success-text:#15803d; --success-border:#86efac;
    --collected-bg:#f0fdf4; --collected-border:#bbf7d0; --collected-text:#166534;
  }
  @media(prefers-color-scheme:dark){
    :root {
      --bg:#1c1c1e; --bg2:#2c2c2e; --text:#f2f2f7; --text2:#8e8e93;
      --border:#3a3a3c; --border2:#48484a;
      --success-bg:#052e16; --success-text:#86efac; --success-border:#166534;
      --collected-bg:#052e16; --collected-border:#166534; --collected-text:#4ade80;
    }
  }
  *{box-sizing:border-box;margin:0;padding:0} body{background:var(--bg)} button,input{font-family:inherit}
  input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
  input[type=number]{-moz-appearance:textfield}
  .shop-edit-grid{display:grid;grid-template-columns:1fr 58px 58px 30px;gap:6px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)}
  .shop-edit-grid:last-child{border-bottom:none}
  .shop-edit-grid input[type=text]{padding:7px 9px;font-size:13px;border:1px solid var(--border2);border-radius:8px;background:var(--bg);color:var(--text);width:100%}
  .shop-edit-grid input[type=number]{padding:7px 5px;font-size:13px;border:1px solid var(--border2);border-radius:8px;background:var(--bg);color:var(--text);width:100%;text-align:right}
  .shop-edit-grid button{width:30px;height:30px;border:1px solid var(--border2);border-radius:7px;background:none;cursor:pointer;color:var(--text2);display:flex;align-items:center;justify-content:center}
  .shop-edit-hdr{display:grid;grid-template-columns:1fr 58px 58px 30px;gap:6px;padding-bottom:6px;border-bottom:1px solid var(--border);margin-bottom:4px}
  .shop-edit-hdr span{font-size:10px;color:var(--text2);font-weight:600;text-transform:uppercase;letter-spacing:.04em}
  .bar-row{display:flex;align-items:center;gap:8px;margin-bottom:6px}
  .bar-label{font-size:12px;color:var(--text2);width:72px;text-align:right;flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .bar-track{flex:1;height:20px;background:var(--bg2);border-radius:4px;overflow:hidden}
  .bar-fill{height:100%;background:var(--text);border-radius:4px}
  .sub-metric{display:flex;justify-content:space-between;align-items:center;padding:5px 0 5px 12px;border-top:1px solid var(--border)}
  .sub-metric:first-child{border-top:1px solid var(--border);margin-top:8px}
`;
