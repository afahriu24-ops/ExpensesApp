(function ($, store, window) {
  "use strict";

  const categories = ["Food", "Transport", "Books", "Rent", "Fun", "Other"];
  const $list = $("#expense-list");
  const $emptyMessage = $("#empty-message");
  const modalElement = document.getElementById("edit-modal");
  const editModal = bootstrap.Modal.getOrCreateInstance(modalElement);
  let expenses = [];

  function makeCell(value, className) {
    return $("<td>").addClass(className || "").text(value);
  }

  function setEmptyMessage(message) {
    $emptyMessage.text(message).show();
  }

  function render() {
    const query = $("#search").val().trim().toLocaleLowerCase();
    const category = $("#filter-category").val();
    const visibleExpenses = expenses.filter(function (expense) {
      return expense.title.toLocaleLowerCase().includes(query) &&
        (!category || expense.category === category);
    });

    $list.empty();
    visibleExpenses.forEach(function (expense) {
      const $row = $("<tr>");
      const $actions = $("<td>").addClass("text-end text-nowrap");
      const $edit = $("<button>")
        .attr({ type: "button", "aria-label": `Edit ${expense.title}` })
        .addClass("btn btn-sm btn-outline-primary me-1")
        .text("Edit")
        .data("id", expense.id);
      const $delete = $("<button>")
        .attr({ type: "button", "aria-label": `Delete ${expense.title}` })
        .addClass("btn btn-sm btn-outline-danger")
        .text("Delete")
        .data("id", expense.id);

      $actions.append($edit, $delete);
      $row.append(
        makeCell(expense.date),
        makeCell(expense.title),
        makeCell(expense.category),
        makeCell(store.formatAmount(expense.amount), "text-end"),
        $actions
      );
      $list.append($row);
    });

    $("#count").text(visibleExpenses.length);
    $("#stat-count").text(expenses.length);
    const total = expenses.reduce(function (sum, expense) {
      return sum + expense.amount;
    }, 0);
    $("#stat-total").text(store.formatAmount(total));
    $("#stat-average").text(store.formatAmount(
      expenses.length ? total / expenses.length : 0
    ));

    if (expenses.length) {
      const biggest = expenses.reduce(function (current, expense) {
        return expense.amount > current.amount ? expense : current;
      });
      $("#stat-biggest").text(`${biggest.title} - ${store.formatAmount(biggest.amount)}`);
    } else {
      $("#stat-biggest").text("none");
    }

    if (!expenses.length) {
      $emptyMessage.html('No expenses yet. <a href="add.html">Add one</a> or <button type="button" class="btn btn-link p-0 align-baseline" id="load-sample">load sample data</button>.').show();
    } else if (!visibleExpenses.length) {
      setEmptyMessage("No expenses match your search.");
    } else {
      $emptyMessage.hide();
    }
  }

  function showEditErrors(errors) {
    ["title", "amount", "category", "date"].forEach(function (field) {
      const $input = $(`#edit-${field}`);
      const message = errors[field] || "";
      $input.toggleClass("is-invalid", Boolean(message));
      $(`.error[data-for="${field}"]`).text(message);
    });
  }

  function validateEdit(values) {
    const errors = {};
    if (!values.title) {
      errors.title = "Enter an expense title.";
    } else if (values.title.length > 100) {
      errors.title = "The title must be 100 characters or fewer.";
    }
    if (!Number.isSafeInteger(values.amount) || values.amount < 1) {
      errors.amount = "Enter a whole amount greater than zero.";
    }
    if (!categories.includes(values.category)) {
      errors.category = "Choose a valid category.";
    }
    if (!store.isValidDate(values.date)) {
      errors.date = "Choose a valid date.";
    }
    return errors;
  }

  $("#search").on("input", render);
  $("#filter-category").on("change", render);

  $(document).on("click", "#load-sample", function () {
    const today = new Date();
    const sampleData = [
      { title: "Lunch", amount: 650, category: "Food", daysAgo: 0 },
      { title: "Bus ticket", amount: 100, category: "Transport", daysAgo: 1 },
      { title: "Notebook", amount: 250, category: "Books", daysAgo: 2 },
      { title: "Groceries", amount: 1200, category: "Food", daysAgo: 3 },
      { title: "Movie", amount: 500, category: "Fun", daysAgo: 4 }
    ];

    const sampleExpenses = sampleData.map(function (item) {
      const date = new Date(today);
      date.setDate(date.getDate() - item.daysAgo);
      return {
        id: store.createId(),
        title: item.title,
        amount: item.amount,
        category: item.category,
        date: date.toISOString().slice(0, 10)
      };
    });

    try {
      store.save(sampleExpenses);
      expenses = sampleExpenses;
      render();
      store.showMessage("Sample expenses added.");
    } catch (error) {
      store.showMessage(`Could not save sample expenses: ${error.message}`);
    }
  });

  $("#clear-all").on("click", function () {
    if (!expenses.length || !window.confirm("Delete all expenses? This cannot be undone.")) {
      return;
    }

    try {
      store.save([]);
      expenses = [];
      render();
      store.showMessage("All expenses deleted.");
    } catch (error) {
      store.showMessage(`Could not delete expenses: ${error.message}`);
    }
  });

  $list.on("click", ".btn-outline-primary", function () {
    const id = $(this).data("id");
    const expense = expenses.find(function (item) {
      return item.id === id;
    });

    if (!expense) {
      store.showMessage("That expense could not be found.");
      return;
    }

    $("#edit-id").val(expense.id);
    $("#edit-title").val(expense.title);
    $("#edit-amount").val(expense.amount);
    $("#edit-category").val(expense.category);
    $("#edit-date").val(expense.date);
    showEditErrors({});
    editModal.show();
  });

  $list.on("click", ".btn-outline-danger", function () {
    const id = $(this).data("id");
    const expense = expenses.find(function (item) {
      return item.id === id;
    });

    if (!expense || !window.confirm(`Delete "${expense.title}"?`)) {
      return;
    }

    try {
      store.save(expenses.filter(function (item) {
        return item.id !== id;
      }));
      expenses = expenses.filter(function (item) {
        return item.id !== id;
      });
      render();
      store.showMessage("Expense deleted.");
    } catch (error) {
      store.showMessage(`Could not delete expense: ${error.message}`);
    }
  });

  $("#edit-form").on("submit", function (event) {
    event.preventDefault();

    const values = {
      title: $("#edit-title").val().trim(),
      amount: Number($("#edit-amount").val()),
      category: $("#edit-category").val(),
      date: $("#edit-date").val()
    };
    const errors = validateEdit(values);
    showEditErrors(errors);

    if (Object.keys(errors).length) {
      $("#edit-form").find(".is-invalid").first().trigger("focus");
      return;
    }

    try {
      const id = $("#edit-id").val();
      const updatedExpenses = expenses.map(function (expense) {
        return expense.id === id ? { ...expense, ...values } : expense;
      });
      store.save(updatedExpenses);
      expenses = updatedExpenses;
      render();
      editModal.hide();
      store.showMessage("Expense updated.");
    } catch (error) {
      store.showMessage(`Could not update expense: ${error.message}`);
    }
  });

  try {
    expenses = store.load();
    render();
  } catch (error) {
    setEmptyMessage(`Could not load expenses: ${error.message}`);
    store.showMessage(`Could not load expenses: ${error.message}`);
  }
})(window.jQuery, window.ExpenseStore, window);
