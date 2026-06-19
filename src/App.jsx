import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { useAppData } from "./hooks/useAppData";
import { todayStr } from "./utils/dates";
import { c } from "./styles/styles";
import { CSS } from "./styles/global";
import Login from "./components/Login";
import ShopsScreen from "./components/delivery/ShopsScreen";
import SessionScreen from "./components/delivery/SessionScreen";
import EntryForm from "./components/delivery/EntryForm";
import DebtScreen from "./components/delivery/DebtScreen";
import Borclar from "./components/Borclar";
import ChorekHesabat from "./components/ChorekHesabat";
import Dashboard from "./components/owner/Dashboard";
import Reports from "./components/owner/Reports";
import EditSection from "./components/owner/EditSection";
import Parametrler from "./components/owner/Parametrler";
import Developer from "./components/owner/Developer";

const OWNER_EMAILS = ["sahmar@gmail.com", "elmirallahverdi@gmail.com"];
const DEVELOPER_EMAILS = ["elmirallahverdi@gmail.com"];

export default function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  if (user === undefined) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg)" }}>
      <style>{CSS}</style>
      <div style={{ fontSize: 14, color: "var(--text2)" }}>Yüklənir…</div>
    </div>
  );

  if (!user) return <Login />;

  const isOwner = OWNER_EMAILS.includes(user.email);
  const isDeveloper = DEVELOPER_EMAILS.includes(user.email);

  return <AppInner isOwner={isOwner} isDeveloper={isDeveloper} userEmail={user.email} onSignOut={() => signOut(auth)} />;
}

function AppInner({ isOwner, isDeveloper, userEmail, onSignOut }) {
  const {
    db_data, loading, tab, setTab, view, setView,
    selShop, setSelShop, selSess, setSelSess,
    entryVals, collectedInput, setCollectedInput,
    ownerUnlocked, setOwnerUnlocked, ownerTab, setOwnerTab,
    pinBuf, pinErr, pinKey,
    dashPeriod, setDashPeriod, repPeriod, setRepPeriod,
    editDate, setEditDate, editView, setEditView,
    editSelShop, setEditSelShop, editSelSess,
    editEntryVals, adjEdit,
    toast, shopEdits, setShopEdits,
    newShopName, setNewShopName,
    settPrices, setSettPrices,
    pinOld, setPinOld, pinNew, setPinNew,
    archives, resetPinBuf, setResetPinBuf,
    resetPinErr, setResetPinErr,
    resetConfirm, setResetConfirm,
    editCollected, setEditCollected,
    expView, setExpView, expVals, setExpVals,
    editDebtShop, setEditDebtShop,
    editDebtVal, setEditDebtVal,
    confirmDeleteShop, setConfirmDeleteShop,
    shopKura, shopRail, toast$,
    openDeliveryEntry, adjDelivery, saveDeliveryEntry,
    saveDebtCollection, openEditEntry, saveEditEntry,
    saveEditDebt, saveEditCollected, saveExpense, deleteExpense,
    resetAllData, calcStats, calcExpenses,
    saveShops, addShop, removeShop, confirmRemoveShop,
    savePrices, changePin, saveHandover, confirmHandover, saveKassaAdjustment,
    saveSweet, restoreBackup,
  } = useAppData(userEmail);

  const TODAY = todayStr();

  if (loading) return (
    <div style={{ ...c.wrap, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center", color: "var(--text2)", fontSize: 14 }}>Yüklənir…</div>
    </div>
  );

  if (db_data === "offline") return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg)", gap: 16, padding: "2rem" }}>
      <style>{CSS}</style>
      <div style={{ fontSize: 48 }}>📡</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text)" }}>İnternet bağlantısı yoxdur</div>
      <div style={{ fontSize: 13, color: "var(--text2)", textAlign: "center" }}>Zəhmət olmasa internetə qoşulub yenidən cəhd edin</div>
      <button onClick={() => window.location.reload()} style={{ padding: "10px 24px", fontSize: 14, fontWeight: 600, border: "none", borderRadius: 10, background: "var(--text)", color: "var(--bg)", cursor: "pointer", marginTop: 8 }}>🔄 Yenilə</button>
    </div>
  );

  if (db_data === "empty") return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg)", gap: 16, padding: "2rem" }}>
      <style>{CSS}</style>
      <div style={{ fontSize: 48 }}>⚠️</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text)" }}>Məlumat tapılmadı</div>
      <div style={{ fontSize: 13, color: "var(--text2)", textAlign: "center", maxWidth: 320 }}>
        Sistemdə məlumat bazası boşdur. Zəhmət olmasa developer ilə əlaqə saxlayın.
      </div>
      <button onClick={() => window.location.reload()} style={{ padding: "10px 24px", fontSize: 14, fontWeight: 600, border: "none", borderRadius: 10, background: "var(--text)", color: "var(--bg)", cursor: "pointer", marginTop: 8 }}>🔄 Yenidən cəhd et</button>
    </div>
  );

  const ownerTabs = [
    ["dashboard", "Satış"],
    ["reports", "Hesabatlar"],
    ["edit", "Mağazaları tənzimlə"],
    ["parametrler", "Parametrlər"],
    ...(isDeveloper ? [["developer", "🛠 Developer"]] : []),
  ];

  const navTabs = isOwner
    ? [["delivery","🚚","Çatdırılma"],["borclar","💰","Borclar"],["hesabat","📊","Çörək Hesabatı"],["owner","🔐","Sahibkar"]]
    : [["delivery","🚚","Çatdırılma"],["borclar","💰","Borclar"],["hesabat","📊","Çörək Hesabatı"]];

  return (
    <div style={c.wrap}>
      <style>{CSS}</style>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap" />
      {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#1a1a1a", color: "#fff", padding: "10px 22px", borderRadius: 30, fontSize: 14, zIndex: 999, whiteSpace: "nowrap" }}>{toast}</div>}

      {confirmDeleteShop !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "var(--bg)", borderRadius: 16, padding: "1.5rem", width: "100%", maxWidth: 320, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Mağazanı sil</div>
            <div style={{ fontSize: 14, color: "var(--text2)", marginBottom: "1.5rem" }}>
              <strong style={{ color: "var(--text)" }}>{db_data.shops[confirmDeleteShop]?.name}</strong> mağazasını silmək istədiyinizdən əminsiniz?
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmDeleteShop(null)} style={{ flex: 1, padding: 11, fontSize: 14, fontWeight: 500, border: "1px solid var(--border2)", borderRadius: 10, background: "none", color: "var(--text)", cursor: "pointer" }}>Yox</button>
              <button onClick={confirmRemoveShop} style={{ flex: 1, padding: 11, fontSize: 14, fontWeight: 600, border: "none", borderRadius: 10, background: "#dc2626", color: "#fff", cursor: "pointer" }}>Hə, sil</button>
            </div>
          </div>
        </div>
      )}

      <div style={c.nav}>
        {navTabs.map(([key,icon,lbl]) => (
          <button key={key} style={c.navBtn(tab===key)} onClick={() => { setTab(key); if (key==="delivery") { setView("shops"); setExpView("list"); } }}>
            <span style={{ fontSize: 18 }}>{icon}</span>{lbl}
          </button>
        ))}
      </div>

      {tab === "delivery" && (
        <>
          {view === "shops" && (
            <ShopsScreen
              db_data={db_data} TODAY={TODAY}
              setSelShop={setSelShop} setView={setView}
              expView={expView} setExpView={setExpView}
              expVals={expVals} setExpVals={setExpVals}
              saveExpense={saveExpense} deleteExpense={deleteExpense}
              saveHandover={saveHandover} saveSweet={saveSweet}
            />
          )}
          {view === "session" && <SessionScreen db_data={db_data} TODAY={TODAY} selShop={selShop} setView={setView} setCollectedInput={setCollectedInput} openDeliveryEntry={openDeliveryEntry} />}
          {view === "entry" && <EntryForm db_data={db_data} vals={entryVals} adjFn={adjDelivery} saveFn={saveDeliveryEntry} backFn={() => setView("session")} shopIdx={selShop} sessId={selSess} date={TODAY} />}
          {view === "debt" && <DebtScreen db_data={db_data} TODAY={TODAY} selShop={selShop} collectedInput={collectedInput} setCollectedInput={setCollectedInput} saveDebtCollection={saveDebtCollection} setView={setView} />}
        </>
      )}

      {tab === "borclar" && <Borclar db_data={db_data} />}
      {tab === "hesabat" && <ChorekHesabat db_data={db_data} />}

      {tab === "owner" && isOwner && (
        <>
          {!ownerUnlocked && (
            <div style={{ minHeight: 320, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "2rem" }}>
              <div style={{ fontSize: 18, fontWeight: 500 }}>Sahibkar paneli</div>
              <div style={{ fontSize: 13, color: "var(--text2)" }}>{userEmail}</div>
              <div style={{ display: "flex", gap: 12, margin: "4px 0" }}>{[0,1,2,3].map(i => <div key={i} style={c.pinDot(i < pinBuf.length)}></div>)}</div>
              <div style={{ color: "#dc2626", fontSize: 13, minHeight: 18 }}>{pinErr}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, width: 220 }}>
                {["1","2","3","4","5","6","7","8","9","clr","0","del"].map(k => (
                  <button key={k} style={c.pinKey} onClick={() => pinKey(k)}>{k==="clr"?"CLR":k==="del"?"⌫":k}</button>
                ))}
              </div>
            </div>
          )}
          {ownerUnlocked && (
            <div>
              <div style={{ padding: "1rem 1rem 0" }}>
                <div style={{ display: "flex", gap: 5, marginBottom: "1rem", flexWrap: "wrap" }}>
                  {ownerTabs.map(([k,l]) => <button key={k} style={c.ownerNavBtn(ownerTab===k)} onClick={() => { setOwnerTab(k); if (k==="edit") setEditView("date-shops"); }}>{l}</button>)}
                </div>
              </div>
              {ownerTab === "dashboard" && <Dashboard db_data={db_data} dashPeriod={dashPeriod} setDashPeriod={setDashPeriod} calcStats={calcStats} calcExpenses={calcExpenses} editDebtShop={editDebtShop} setEditDebtShop={setEditDebtShop} editDebtVal={editDebtVal} setEditDebtVal={setEditDebtVal} saveEditDebt={saveEditDebt} saveHandover={saveHandover} confirmHandover={confirmHandover} saveKassaAdjustment={saveKassaAdjustment} saveExpense={saveExpense} deleteExpense={deleteExpense} />}
              {ownerTab === "reports" && <Reports db_data={db_data} repPeriod={repPeriod} setRepPeriod={setRepPeriod} calcStats={calcStats} shopKura={shopKura} shopRail={shopRail} toast$={toast$} />}
              {ownerTab === "edit" && <EditSection db_data={db_data} editDate={editDate} setEditDate={setEditDate} editView={editView} setEditView={setEditView} editSelShop={editSelShop} setEditSelShop={setEditSelShop} editSelSess={editSelSess} editEntryVals={editEntryVals} adjEdit={adjEdit} saveEditEntry={saveEditEntry} openEditEntry={openEditEntry} editCollected={editCollected} setEditCollected={setEditCollected} saveEditCollected={saveEditCollected} editDebtShop={editDebtShop} setEditDebtShop={setEditDebtShop} editDebtVal={editDebtVal} setEditDebtVal={setEditDebtVal} saveEditDebt={saveEditDebt} saveHandover={saveHandover} saveKassaAdjustment={saveKassaAdjustment} saveSweet={saveSweet} saveExpense={saveExpense} deleteExpense={deleteExpense} />}
              {ownerTab === "parametrler" && <Parametrler db_data={db_data} settPrices={settPrices} setSettPrices={setSettPrices} savePrices={savePrices} pinOld={pinOld} setPinOld={setPinOld} pinNew={pinNew} setPinNew={setPinNew} changePin={changePin} shopEdits={shopEdits} setShopEdits={setShopEdits} newShopName={newShopName} setNewShopName={setNewShopName} addShop={addShop} removeShop={removeShop} saveShops={saveShops} />}
              {ownerTab === "developer" && isDeveloper && <Developer db_data={db_data} archives={archives} resetConfirm={resetConfirm} setResetConfirm={setResetConfirm} resetPinBuf={resetPinBuf} setResetPinBuf={setResetPinBuf} resetPinErr={resetPinErr} setResetPinErr={setResetPinErr} resetAllData={resetAllData} restoreBackup={restoreBackup} toast$={toast$} />}
              <div style={{ padding: "0 1rem 1.5rem" }}>
                <button style={{ ...c.outlineBtn, color: "#dc2626", borderColor: "#fca5a5" }} onClick={onSignOut}>Çıxış</button>
              </div>
            </div>
          )}
        </>
      )}

      {!isOwner && (
        <div style={{ padding: "0.5rem 1rem", textAlign: "right" }}>
          <button onClick={onSignOut} style={{ fontSize: 12, color: "var(--text2)", background: "none", border: "none", cursor: "pointer" }}>Çıxış →</button>
        </div>
      )}
    </div>
  );
}
