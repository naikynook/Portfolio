document.addEventListener("DOMContentLoaded", () => {
  // Cache the main elements that the controls will update.
  const stage = document.querySelector(".project-stage");
  const cards = document.querySelectorAll(".project-card");
  const viewButtons = document.querySelectorAll("[data-view]");
  const filterButtons = document.querySelectorAll("[data-filter]");
  const aboutButton = document.querySelector("[data-about]");
  const appsButton = document.querySelector("[data-apps]");
  const aboutPanel = document.querySelector(".about-panel");
  const appsPanel = document.querySelector(".apps-panel");
  const listPreview = document.querySelector(".list-preview");
  const resetMark = document.querySelector(".reset-mark");

  // Visually marks one button in a group as active and updates aria-pressed.
  function setActive(buttons, activeButton) {
    buttons.forEach((button) => {
      const isActive = button === activeButton;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  // Switches between image-based Gallery View and text-based List View.
  function setView(view, activeButton) {
    stage.classList.toggle("gallery-view", view === "gallery");
    stage.classList.toggle("list-view", view === "list");
    document.body.classList.toggle("is-list-view", view === "list");
    setActive(viewButtons, activeButton);

    if (view === "list") {
      selectFirstVisibleCard();
    } else {
      cards.forEach((card) => card.classList.remove("is-selected"));
      resetListPreview();
    }
  }

  // Filters the project cards using each card's data-category values.
  function setFilter(filter, activeButton) {
    stage.dataset.filter = filter;

    cards.forEach((card) => {
      const categories = card.dataset.category.split(" ");
      const isVisible = filter === "all" || categories.includes(filter);
      card.classList.toggle("is-hidden", !isVisible);
    });

    setActive(filterButtons, activeButton);
    aboutPanel.classList.remove("is-open");

    if (stage.classList.contains("list-view")) {
      selectFirstVisibleCard();
    }
  }

  // Selects one project in List View and updates the preview image.
  function selectCard(selectedCard) {
    cards.forEach((card) => {
      card.classList.toggle("is-selected", card === selectedCard);
    });

    updateListPreview(selectedCard);
  }

  // When entering List View or changing filters, show the first available project.
  function selectFirstVisibleCard() {
    const firstVisibleCard = Array.from(cards).find((card) => {
      return !card.classList.contains("is-hidden");
    });

    if (firstVisibleCard) {
      selectCard(firstVisibleCard);
    } else {
      resetListPreview();
    }
  }

  // Copies the selected project's preview settings into the fixed preview layer.
  function updateListPreview(selectedCard) {
    const selectedImage = selectedCard.querySelector(".project-image");
    const imageClasses = Array.from(selectedImage.classList).filter((className) => {
      return className !== "project-image";
    });
    const isProfessional = selectedCard.dataset.category.split(" ").includes("professional");
    const previewUrl = selectedCard.dataset.preview;
    const previewFit = selectedCard.dataset.previewFit || "cover";
    const previewPosition = selectedCard.dataset.previewPosition || "center";

    listPreview.className = ["list-preview", ...imageClasses, isProfessional ? "is-professional" : ""]
      .filter(Boolean)
      .join(" ");
    listPreview.style.background = "";

    if (previewUrl) {
      listPreview.style.background = `#f7f7f4 url("${previewUrl}") ${previewPosition} / ${previewFit} no-repeat`;
    } else {
      listPreview.style.background = selectedImage.style.background || "";
    }
  }

  // Clears the list preview when leaving List View.
  function resetListPreview() {
    listPreview.className = "list-preview";
    listPreview.style.background = "";
  }

  // View control buttons: List View / Gallery View.
  viewButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.classList.contains("is-active")));
    button.addEventListener("click", () => setView(button.dataset.view, button));
  });

  // Filter buttons: All / Projects / Academic / Professional.
  filterButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.classList.contains("is-active")));
    button.addEventListener("click", () => setFilter(button.dataset.filter, button));
  });

  // In List View, clicking a project title changes the preview image.
  stage.addEventListener("click", (event) => {
    const selectedCard = event.target.closest(".project-card");

    if (!selectedCard || !stage.classList.contains("list-view")) {
      return;
    }

    event.preventDefault();
    selectCard(selectedCard);
  });

  // Small pop-up panels for About and Apps.
  aboutButton.addEventListener("click", () => {
    aboutPanel.classList.toggle("is-open");
    appsPanel.classList.remove("is-open");
  });

  appsButton.addEventListener("click", () => {
    appsPanel.classList.toggle("is-open");
    aboutPanel.classList.remove("is-open");
  });

  // Reset to the default state.
  resetMark.addEventListener("click", () => {
    setView("gallery", document.querySelector('[data-view="gallery"]'));
    setFilter("all", document.querySelector('[data-filter="all"]'));
    aboutPanel.classList.remove("is-open");
    appsPanel.classList.remove("is-open");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

