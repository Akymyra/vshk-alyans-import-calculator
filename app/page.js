"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Sun, Moon } from "lucide-react";
import "./globals.css";

export default function FuelSavingCalculator() {
  // ======= Splash screen =======
  const [appLoading, setAppLoading] = useState(true);
  const [fadeStage, setFadeStage] = useState("fade-in");

  useEffect(() => {
    const t1 = setTimeout(() => setFadeStage("visible"), 800);
    const t2 = setTimeout(() => setFadeStage("fade-out"), 3300);
    const t3 = setTimeout(() => setAppLoading(false), 4300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // ======= Ввод =======
  const [distance, setDistance] = useState("");
  const [consumption, setConsumption] = useState("");
  const [fuelPrice, setFuelPrice] = useState("");

  // История
  const [distanceHistory, setDistanceHistory] = useState([]);
  const [consumptionHistory, setConsumptionHistory] = useState([]);
  const [fuelPriceHistory, setFuelPriceHistory] = useState([]);
  const [showHistory, setShowHistory] = useState({
    distance: false,
    consumption: false,
    fuelPrice: false,
  });

  // ======= Результаты =======
  const [savings, setSavings] = useState({});
  const [loading, setLoading] = useState(false);

  // ======= UI =======
  const [theme, setTheme] = useState("dark");
  const [toast, setToast] = useState({ type: "", msg: "" });
  const [isMobileView, setIsMobileView] = useState(false);

  const loaderRef = useRef(null);
  const resultsRef = useRef(null);

  // ======= Автоопределение устройства =======
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handleResize = (e) => setIsMobileView(e.matches);
    handleResize(mq);
    mq.addEventListener("change", handleResize);
    return () => mq.removeEventListener("change", handleResize);
  }, []);

  // ======= Проценты снижения расхода =======
  const brandReductions = {
    Aufine: 5.0,
    Annaite: 4.8,
    Kapsen: 4.7,
    Pegasus: 4.5,
    "Другие шины": 3.5,
  };

  const COLORS = ["#0066ff", "#22c55e", "#f97316", "#9333ea", "#a3a3a3"];

  // ======= useEffect =======
  useEffect(() => {
    setDistanceHistory(JSON.parse(localStorage.getItem("distanceHistory") || "[]"));
    setConsumptionHistory(JSON.parse(localStorage.getItem("consumptionHistory") || "[]"));
    setFuelPriceHistory(JSON.parse(localStorage.getItem("fuelPriceHistory") || "[]"));

    const lastDist = localStorage.getItem("lastDistance");
    const lastCons = localStorage.getItem("lastConsumption");
    const lastPrice = localStorage.getItem("lastFuelPrice");
    if (lastDist) setDistance(lastDist);
    if (lastCons) setConsumption(lastCons);
    if (lastPrice) setFuelPrice(lastPrice);
  }, []);

  useEffect(() => {
    if (!toast.msg) return;
    const t = setTimeout(() => setToast({ type: "", msg: "" }), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (loading && loaderRef.current) {
      setTimeout(() => loaderRef.current.scrollIntoView({ behavior: "smooth" }), 500);
    }
  }, [loading]);

  useEffect(() => {
    if (Object.keys(savings).length > 0 && resultsRef.current) {
      setTimeout(() => resultsRef.current.scrollIntoView({ behavior: "smooth" }), 600);
    }
  }, [savings]);

  // ======= Утилиты =======
  const sanitizeToDigits = (v) => v.replace(/\D/g, "");
  const allowOnlyDigitsOnKeyDown = (e) => {
    const allowed = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight"];
    if (allowed.includes(e.key)) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  };
  const handlePasteDigits = (e, setter) => {
    e.preventDefault();
    setter(sanitizeToDigits(e.clipboardData.getData("text")));
  };

  const saveToHistory = (key, value, setter, saveKey) => {
    if (!value) return;
    const saved = JSON.parse(localStorage.getItem(key) || "[]");
    if (!saved.includes(value)) {
      const updated = [value, ...saved].slice(0, 5);
      localStorage.setItem(key, JSON.stringify(updated));
      setter(updated);
    }
    localStorage.setItem(saveKey, value);
  };

  const showError = (msg) => setToast({ type: "error", msg });
  const showSuccess = (msg) => setToast({ type: "success", msg });

  // ======= Диаграмма =======
  const buildPieData = (savingsObj) => {
    if (!savingsObj || Object.keys(savingsObj).length === 0) return [];
    const FIXED_SHARES = [0.3, 0.25, 0.2, 0.15, 0.1];
    const sorted = Object.entries(savingsObj).sort((a, b) => b[1] - a[1]);
    return sorted.map(([brand, realValue], idx) => ({
      name: brand,
      value: FIXED_SHARES[idx] * 100,
      real: realValue,
    }));
  };

  // ======= Расчёт =======
  const calculateSavings = () => {
    setSavings({});
    if (!distance || !consumption || !fuelPrice) {
      showError("⚠️ Введите все данные!");
      return;
    }

    const dist = parseInt(distance, 10);
    const cons = parseInt(consumption, 10);
    const price = parseInt(fuelPrice, 10);

    if (dist <= 0 || cons <= 0 || price <= 0) {
      showError("⚠️ Данные должны быть больше 0!");
      return;
    }

    saveToHistory("distanceHistory", distance, setDistanceHistory, "lastDistance");
    saveToHistory("consumptionHistory", consumption, setConsumptionHistory, "lastConsumption");
    saveToHistory("fuelPriceHistory", fuelPrice, setFuelPriceHistory, "lastFuelPrice");

    setLoading(true);

    setTimeout(() => {
      const brandFactors = Object.fromEntries(
        Object.entries(brandReductions).map(([n, pct]) => [n, 1 - pct / 100])
      );

      const baseFuelTotal = (dist / 100) * cons;
      const brandSavings = {};
      for (const [brand, factor] of Object.entries(brandFactors)) {
        const brandFuel = baseFuelTotal * factor;
        brandSavings[brand] = (baseFuelTotal - brandFuel) * price;
      }

      setSavings(brandSavings);
      setLoading(false);
      showSuccess("✅ Расчёт выполнен");
    }, 2500);
  };

  // ======= PDF =======
  const downloadPDF = () => {
    const el = document.getElementById("pdf-content");
    if (!el) return;
    const screenOnly = el.querySelectorAll(".screen-only");
    screenOnly.forEach((n) => (n.style.display = "none"));
    setTimeout(() => {
      html2canvas(el, { scale: 3, backgroundColor: "#fff", useCORS: true }).then((canvas) => {
        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        let imgWidth = pageWidth;
        let imgHeight = (canvas.height * imgWidth) / canvas.width;
        if (imgHeight > pageHeight) {
          const ratio = imgHeight / pageHeight;
          imgHeight = pageHeight;
          imgWidth = imgWidth / ratio;
        }
        const x = (pageWidth - imgWidth) / 2;
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", x, 0, imgWidth, imgHeight);
        pdf.save("Alliance_Fuel_Savings.pdf");
        screenOnly.forEach((n) => (n.style.display = ""));
      });
    }, 200);
  };

  // ======= Поле ввода =======
  const renderInput = (label, value, setValue, history, keyName, setHistory) => (
    <div className="relative">
      <input
        type="text"
        value={value}
        inputMode="numeric"
        pattern="[0-9]*"
        onFocus={() => setShowHistory((p) => ({ ...p, [keyName]: true }))}
        onBlur={() => setTimeout(() => setShowHistory((p) => ({ ...p, [keyName]: false })), 200)}
        onChange={(e) => {
          const val = sanitizeToDigits(e.target.value);
          setValue(val);
          if (val) {
            localStorage.setItem(`last${keyName[0].toUpperCase() + keyName.slice(1)}`, val);
          } else {
            localStorage.removeItem(`last${keyName[0].toUpperCase() + keyName.slice(1)}`);
          }
        }}
        onKeyDown={allowOnlyDigitsOnKeyDown}
        onPaste={(e) => handlePasteDigits(e, setValue)}
        className="w-full p-3 rounded-lg text-black pr-16"
        placeholder={label}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            localStorage.removeItem(`last${keyName[0].toUpperCase() + keyName.slice(1)}`);
          }}
          className="absolute right-9 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
          title="Очистить поле"
        >
          ✖
        </button>
      )}
      {history.length > 0 && (
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem(`${keyName}History`);
            setHistory([]);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
          title="Очистить историю"
        >
          🗑
        </button>
      )}
      {showHistory[keyName] && history.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
          {history.map((item, idx) => (
            <div
              key={idx}
              onMouseDown={() => setValue(item)}
              className="px-3 py-2 hover:bg-gray-200 cursor-pointer text-black text-sm"
            >
              {item}
            </div>
          ))}
          <div className="px-3 py-2 border-t text-xs text-gray-500">
            Сохраняется до 5 последних значений. Очистить — кнопка 🗑
          </div>
        </div>
      )}
    </div>
  );

  const iconSize = isMobileView ? "w-12 h-12" : "w-16 h-16";
  const contentWidthClass = isMobileView ? "max-w-[340px]" : "max-w-[720px]";
  const pieData = buildPieData(savings);

  // ======= Рендер =======
  return (
    <div
      className={`min-h-screen flex items-center justify-center p-3 ${
        theme === "dark" ? "bg-gray-900/70" : "bg-white/70"
      }`}
    >
      {appLoading ? (
        // Splash screen
        <div
          className={`min-h-screen flex flex-col justify-center items-center transition-opacity duration-1000 ${
            fadeStage === "fade-in"
              ? "opacity-0"
              : fadeStage === "visible"
              ? "opacity-100"
              : "opacity-0"
          }`}
        >
          <img src="/logo.svg" alt="Логотип" className="w-[420px] h-auto" />
        </div>
      ) : (
        // Карточка калькулятора
        <div
          className={`${
            isMobileView ? "max-w-[380px]" : "max-w-3xl"
          } w-full p-4 rounded-2xl shadow-lg relative border text-center transition-opacity duration-700 opacity-100`}
          style={
            theme === "light"
              ? { backgroundColor: "#dce7f5", color: "#028cff" }
              : { backgroundColor: "rgba(40,60,80,0.6)", color: "#028cff" }
          }
        >
          {/* Toast */}
          {toast.msg && (
            <div
              className={`fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg z-50 ${
                toast.type === "error" ? "bg-red-500" : "bg-emerald-500"
              } text-white`}
            >
              {toast.msg}
            </div>
          )}

          {/* Переключатель темы */}
          <div className="absolute top-4 right-4 screen-only">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={`p-2 rounded-full ${
                theme === "dark" ? "bg-orange-500" : "bg-blue-900"
              }`}
              title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
            >
              {theme === "dark" ? (
                <Sun size={20} color="white" />
              ) : (
                <Moon size={20} color="white" />
              )}
            </button>
          </div>

          {/* Лого */}
          <div className="flex justify-center">
            <img
              src="/logo.svg"
              alt="ВШК Альянс-Импорт"
              className="w-full max-w-[300px] h-auto"
            />
          </div>

          <h1
            className="text-xl sm:text-2xl font-bold mb-3 text-center"
            style={{ color: "#028cff" }}
          >
            Калькулятор экономии топлива
          </h1>

          <p className="mb-4 text-sm text-center max-w-xl mx-auto">
            Укажите пробег, расход и цену топлива — и узнайте, сколько сможете
            сэкономить с шинами <b>Annaite, Aufine, Kapsen и Pegasus</b>. <br />
            ⚠️ Это <b>предварительный расчёт</b>, реальная экономия зависит от
            дорог, нагрузки, стиля вождения и техсостояния.
          </p>

          {/* Поля */}
          <div
            className={`${
              isMobileView ? "max-w-xs" : "max-w-md"
            } mx-auto space-y-3`}
          >
            {renderInput(
              "Пробег, км",
              distance,
              setDistance,
              distanceHistory,
              "distance",
              setDistanceHistory
            )}
            {renderInput(
              "Расход, л/100км",
              consumption,
              setConsumption,
              consumptionHistory,
              "consumption",
              setConsumptionHistory
            )}
            {renderInput(
              "Цена топлива, ₽/л",
              fuelPrice,
              setFuelPrice,
              fuelPriceHistory,
              "fuelPrice",
              setFuelPriceHistory
            )}
          </div>

          <button
            onClick={calculateSavings}
            className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold"
          >
            Рассчитать экономию
          </button>

          {/* Лоадер */}
          {loading && (
            <div ref={loaderRef} className="flex flex-col items-center mt-4">
              <img
                src="/tire.png"
                alt="Загрузка"
                className="w-20 sm:w-28 h-auto animate-smooth-spin"
              />
              <p className="mt-2 text-center" style={{ color: "#028cff" }}>
                Идёт расчёт…
              </p>
            </div>
          )}

          {/* Результаты */}
          {Object.keys(savings).length > 0 && (
            <div
              id="pdf-content"
              ref={resultsRef}
              className="mt-6 space-y-4 bg-white p-4 rounded-2xl shadow-lg text-center mx-auto"
              style={{ color: "#028cff", maxWidth: "100%" }}
            >
              <div className="flex justify-center">
                <img
                  src="/logo.svg"
                  alt="ВШК Альянс-Импорт"
                  className="w-full max-w-[300px] h-auto"
                />
              </div>
              <h2 className="text-lg sm:text-xl font-bold mb-3">
                Калькулятор экономии топлива
              </h2>

              <p className="mb-2 text-sm sm:text-base text-center">
                На основании введённых данных выполнен{" "}
                <b>предварительный расчёт</b>. Реальная экономия зависит от
                условий дороги, нагрузки, стиля вождения, давления и
                техсостояния. <br />
                С нашими шинами вы сможете сэкономить{" "}
                <b>
                  от {Math.min(...Object.values(savings)).toFixed(0)} ₽ до{" "}
                  {Math.max(...Object.values(savings)).toFixed(0)} ₽
                </b>
                .
              </p>

              {/* Диаграмма */}
              <div className={`${contentWidthClass} w-full mx-auto`}>
                <div className="w-full px-4">
                  <div className="border border-gray-300 rounded-lg flex justify-center">
                    <ResponsiveContainer
                      width="100%"
                      height={isMobileView ? 260 : 340}
                    >
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={isMobileView ? 100 : 140}
                          labelLine={false}
                        >
                          {pieData.map((entry, idx) => (
                            <Cell
                              key={`cell-${entry.name}`}
                              fill={COLORS[idx % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v, n, props) =>
                            `${props.payload.real.toFixed(0)} ₽`
                          }
                          labelFormatter={(label) => `Бренд: ${label}`}
                        />
                        <Legend
                          layout={isMobileView ? "horizontal" : "vertical"}
                          verticalAlign={isMobileView ? "bottom" : "middle"}
                          align={isMobileView ? "center" : "right"}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Таблица */}
                <div className="flex justify-center mt-4">
                  <table
                    className={`border-collapse border border-gray-300 w-full text-center ${
                      isMobileView ? "text-[9px]" : "text-sm"
                    }`}
                  >
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border px-2 py-1">Показатель</th>
                        {Object.keys(brandReductions).map((brand) => (
                          <th key={brand} className="border px-2 py-1">
                            {brand}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border px-2 py-1">Снижение расхода</td>
                        {Object.values(brandReductions).map((pct, idx) => (
                          <td key={idx} className="border px-2 py-1">
                            −{pct}%
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="border px-2 py-1">Экономия денег</td>
                        {Object.keys(brandReductions).map((brand) => (
                          <td key={brand} className="border px-2 py-1">
                            {savings[brand]?.toFixed(0)} ₽
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Иконки */}
              <div className="flex justify-center gap-6 mt-6 flex-wrap">
                {[
                  { src: "/fuel.png", text: "Экономия топлива" },
                  { src: "/money.png", text: "Экономия денег" },
                  { src: "/speed.png", text: "Быстрый расчёт" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center w-20">
                    <img
                      src={item.src}
                      alt={item.text}
                      className={`${iconSize} mb-2 object-contain`}
                    />
                    <p
                      className={`${
                        isMobileView ? "text-xs" : "text-sm"
                      } text-center`}
                    >
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Кнопка PDF */}
              <div className="screen-only mt-4">
                <button
                  onClick={downloadPDF}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold"
                >
                  Скачать PDF
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

















































