(function (window, $) {
  "use strict";

  const storageKey = "expenses";
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  function isValidDate(value) {
    if (typeof value !== "string" || !datePattern.test(value)) {
      return false;
    }

    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function normalizeExpense(expense) {
    if (!expense || typeof expense !== "object") {
      throw new Error("Saved expense data is invalid.");
    }

    const title = typeof expense.title === "string" ? expense.title.trim() : "";
    const amount = Number(expense.amount);
    const category = typeof expense.category === "string" ? expense.category : "";
    const date = expense.date;

    if (!title || !Number.isSafeInteger(amount) || amount < 1 || !category || !isValidDate(date)) {
      throw new Error("Saved expense data is invalid.");
    }

    return {
      id: typeof expense.id === "string" && expense.id ? expense.id : createId(),
      title,
      amount,
      category,
      date
    };
  }

  function load() {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === null) {
      return [];
    }

    const parsed = JSON.parse(stored);
    const expenses = Array.isArray(parsed) ? parsed : [parsed];
    return expenses.map(normalizeExpense);
  }

  function save(expenses) {
    window.localStorage.setItem(storageKey, JSON.stringify(expenses.map(normalizeExpense)));
  }

  function formatAmount(amount) {
    return `${new Intl.NumberFormat().format(amount)} Lek`;
  }

  let toastTimer;
  function showMessage(message) {
    const toast = $("#toast");
    window.clearTimeout(toastTimer);
    toast.text(message).addClass("show");
    toastTimer = window.setTimeout(function () {
      toast.removeClass("show");
    }, 3000);
  }

  window.ExpenseStore = {
    createId,
    formatAmount,
    isValidDate,
    load,
    save,
    showMessage
  };
})(window, window.jQuery);
