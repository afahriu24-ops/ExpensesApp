(function ($, store) {
  "use strict";

  const $form = $("#expense-form");
  const fields = ["title", "amount", "category", "date"];

  function clearErrors() {
    fields.forEach(function (field) {
      $(`#${field}`).removeClass("is-invalid");
      $(`.error[data-for="${field}"]`).text("");
    });
  }

  function validate(values) {
    const errors = {};
    if (!values.title) {
      errors.title = "Enter an expense title.";
    } else if (values.title.length > 100) {
      errors.title = "The title must be 100 characters or fewer.";
    }

    if (!Number.isSafeInteger(values.amount) || values.amount < 1) {
      errors.amount = "Enter a whole amount greater than zero.";
    }

    if (!values.category) {
      errors.category = "Choose a category.";
    }

    if (!values.date) {
      errors.date = "Choose a date.";
    } else if (!store.isValidDate(values.date)) {
      errors.date = "Enter a valid date.";
    }

    return errors;
  }

  function displayErrors(errors) {
    Object.keys(errors).forEach(function (field) {
      $(`#${field}`).addClass("is-invalid");
      $(`.error[data-for="${field}"]`).text(errors[field]);
    });
  }

  function renderRecent(expense) {
    const $item = $("<li>").addClass("list-group-item d-flex justify-content-between gap-3");
    const $description = $("<span>").text(`${expense.title} - ${expense.category} - ${expense.date}`);
    const $amount = $("<strong>").text(store.formatAmount(expense.amount));

    $("#recent-list").empty().append($item.append($description, $amount));
    $("#recent").removeClass("d-none");
  }

  $form.on("submit", function (event) {
    event.preventDefault();
    clearErrors();

    const values = {
      title: $("#title").val().trim(),
      amount: Number($("#amount").val()),
      category: $("#category").val(),
      date: $("#date").val()
    };
    const errors = validate(values);

    if (Object.keys(errors).length > 0) {
      displayErrors(errors);
      $form.find(".is-invalid").first().trigger("focus");
      return;
    }

    try {
      const expenses = store.load();
      const expense = { id: store.createId(), ...values };
      expenses.push(expense);
      store.save(expenses);
      $form[0].reset();
      renderRecent(expense);
      store.showMessage("Expense added.");
    } catch (error) {
      store.showMessage(`Could not save expense: ${error.message}`);
    }
  });

  fields.forEach(function (field) {
    $(`#${field}`).on("input change", function () {
      $(this).removeClass("is-invalid");
      $(`.error[data-for="${field}"]`).text("");
    });
  });
})(window.jQuery, window.ExpenseStore);
