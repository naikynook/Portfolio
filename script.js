document.addEventListener("DOMContentLoaded", () => {
  // Cache the main elements that the controls will update.
  const stage = document.querySelector(".project-stage");
  const tracks = document.querySelectorAll(".gallery-row-track");
  const loopSpeed = 140;
  const loopStates = [];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let loopTime = 0;

  function makeLoopClone(source) {
    const clone = source.cloneNode(true);
    clone.classList.add("is-clone");
    clone.setAttribute("aria-hidden", "true");
    clone.querySelectorAll(".project-card").forEach((card) => {
      card.classList.add("is-clone");
      card.setAttribute("aria-hidden", "true");
    });
    return clone;
  }

  function measureDistance(source) {
    const next = source.nextElementSibling;

    if (next && next.classList.contains("gallery-row-set")) {
      const distance = next.offsetTop - source.offsetTop;

      if (distance > 0) {
        return Math.round(distance);
      }
    }

    return Math.round(source.offsetHeight);
  }

  function fillCopies(state) {
    const distance = measureDistance(state.source);

    if (!distance) {
      return 0;
    }

    const viewport = Math.max(window.innerHeight, state.track.parentElement ? state.track.parentElement.clientHeight : 0);
    const needed = Math.max(2, Math.ceil(viewport / distance) + 1);

    while (state.track.querySelectorAll(".gallery-row-set").length < needed) {
      state.track.appendChild(makeLoopClone(state.source));
    }

    return measureDistance(state.source) || distance;
  }

  function isLooping() {
    return (
      stage.classList.contains("gallery-view") &&
      stage.dataset.filter === "all" &&
      !document.body.classList.contains("is-gallery-paused") &&
      !reduceMotion.matches
    );
  }

  function tickLoop(now) {
    const delta = loopTime ? Math.min((now - loopTime) / 1000, 0.05) : 0;
    loopTime = now;
    const running = isLooping();
    const showAll = stage.classList.contains("gallery-view") && stage.dataset.filter === "all";

    loopStates.forEach((state) => {
      if (!state.distance) {
        state.distance = fillCopies(state);
      }

      if (!state.distance) {
        return;
      }

      if (running) {
        state.offset += loopSpeed * delta;

        while (state.offset >= state.distance) {
          state.offset -= state.distance;
        }
      }

      if (!showAll) {
        return;
      }

      const y = state.direction === "up" ? -state.offset : state.offset - state.distance;
      state.track.style.transform = `translate3d(0, ${y}px, 0)`;
    });

    requestAnimationFrame(tickLoop);
  }

  function prepareGalleryLoops() {
    tracks.forEach((track, index) => {
      const source = track.querySelector(".gallery-row-set:not(.is-clone)");

      if (!source) {
        return;
      }

      track.querySelectorAll(".gallery-row-set.is-clone").forEach((clone) => clone.remove());
      track.appendChild(makeLoopClone(source));

      loopStates.push({
        track,
        source,
        offset: index * 120,
        distance: 0,
        direction: track.closest(".gallery-row-up") ? "up" : "down",
      });
    });
  }

  prepareGalleryLoops();
  requestAnimationFrame(tickLoop);

  const cards = document.querySelectorAll(".project-card:not(.is-clone)");
  const galleryCards = document.querySelectorAll(".project-card");
  const viewButtons = document.querySelectorAll("[data-view]");
  const filterButtons = document.querySelectorAll("[data-filter]");
  const aboutButton = document.querySelector("[data-about]");
  const appsButton = document.querySelector("[data-apps]");
  const aboutPanel = document.querySelector(".about-panel");
  const appsPanel = document.querySelector(".apps-panel");
  const listPreview = document.querySelector(".list-preview");
  const lightbox = document.querySelector(".gallery-lightbox");
  const lightboxImage = document.querySelector(".gallery-lightbox-image");
  const lightboxVideo = document.querySelector(".gallery-lightbox-video");
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
      closeLightbox(false);
      selectFirstVisibleCard();
    } else {
      cards.forEach((card) => card.classList.remove("is-selected"));
      resetListPreview();
    }
  }

  // Filters the project cards using each card's data-category values.
  function setFilter(filter, activeButton) {
    stage.dataset.filter = filter;

    galleryCards.forEach((card) => {
      const categories = card.dataset.category.split(" ");
      const isVisible = filter === "all" || categories.includes(filter);
      card.classList.toggle("is-hidden", !isVisible);
    });

    setActive(filterButtons, activeButton);
    aboutPanel.classList.remove("is-open");
    closeLightbox(false);

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
    const previewFit = selectedCard.dataset.previewFit || "contain";
    const previewPosition = selectedCard.dataset.previewPosition || "center";
    const previewBg = selectedCard.dataset.previewBg || "#f7f7f4";

    listPreview.className = ["list-preview", ...imageClasses, isProfessional ? "is-professional" : ""]
      .filter(Boolean)
      .join(" ");
    listPreview.style.background = "";
    sizeListPreview(selectedCard);

    if (previewUrl) {
      listPreview.style.background = `${previewBg} url("${previewUrl}") ${previewPosition} / ${previewFit} no-repeat`;
    } else {
      listPreview.style.background = selectedImage.style.background || "";
    }
  }

  // Sizes the list preview to the same aspect ratio as the gallery card.
  function sizeListPreview(selectedCard) {
    const parts = (selectedCard.dataset.aspect || "1 / 1").split("/").map((value) => Number(value.trim()));
    const widthRatio = parts[0] || 1;
    const heightRatio = parts[1] || 1;
    const isMobile = window.matchMedia("(max-width: 760px)").matches;
    const maxWidth = isMobile
      ? Math.min(window.innerWidth * 0.44, 190)
      : Math.min(window.innerWidth * 0.42, 420);
    const maxHeight = isMobile
      ? Math.min(window.innerHeight * 0.36, 220)
      : Math.min(window.innerHeight * 0.58, 520);
    const scale = Math.min(maxWidth / widthRatio, maxHeight / heightRatio);

    listPreview.style.width = `${Math.max(1, Math.round(widthRatio * scale))}px`;
    listPreview.style.height = `${Math.max(1, Math.round(heightRatio * scale))}px`;
  }

  // Clears the list preview when leaving List View.
  function resetListPreview() {
    listPreview.className = "list-preview";
    listPreview.style.background = "";
    listPreview.style.width = "";
    listPreview.style.height = "";
  }

  // View control buttons: List View / Gallery View.
  viewButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.classList.contains("is-active")));
    button.addEventListener("click", () => setView(button.dataset.view, button));
  });

  function openLightbox(card) {
    const previewUrl = card.dataset.preview;
    const previewVideo = card.dataset.previewVideo;
    const isProfessional = card.dataset.category.split(" ").includes("professional");
    const label = card.querySelector(".project-label");

    if (!previewUrl && !previewVideo) {
      return;
    }

    lightboxImage.classList.toggle("is-professional", isProfessional);
    lightboxVideo.classList.toggle("is-professional", isProfessional);

    if (previewVideo) {
      lightboxVideo.src = previewVideo;
      lightboxVideo.poster = previewUrl || "";
      lightboxImage.removeAttribute("src");
      lightboxImage.alt = "";
      document.body.classList.add("is-lightbox-video");
      lightboxVideo.play().catch(() => {});
    } else {
      lightboxImage.src = previewUrl;
      lightboxImage.alt = label ? label.textContent.trim() : "";
      lightboxVideo.pause();
      lightboxVideo.removeAttribute("src");
      document.body.classList.remove("is-lightbox-video");
    }

    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-lightbox-open", "is-gallery-paused");
  }

  function closeLightbox(resumeMotion) {
    lightboxImage.removeAttribute("src");
    lightboxImage.alt = "";
    lightboxImage.classList.remove("is-professional");
    lightboxVideo.pause();
    lightboxVideo.removeAttribute("src");
    lightboxVideo.classList.remove("is-professional");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-lightbox-open", "is-lightbox-video");

    if (resumeMotion) {
      document.body.classList.remove("is-gallery-paused");
    }
  }

  // Gallery clicks: pause/resume All, fullscreen an icon, close by clicking the background.
  document.addEventListener("click", (event) => {
    if (!stage.classList.contains("gallery-view")) {
      return;
    }

    if (event.target.closest(".top-interface, .filter-pill, .about-panel, .apps-panel, .reset-mark")) {
      return;
    }

    event.preventDefault();

    const isAll = stage.dataset.filter === "all";
    const clickedCard = event.target.closest(".project-card");
    const clickedLightboxMedia = event.target.closest(".gallery-lightbox-image, .gallery-lightbox-video");
    const lightboxOpen = document.body.classList.contains("is-lightbox-open");
    const isPaused = document.body.classList.contains("is-gallery-paused");

    if (lightboxOpen) {
      if (!clickedLightboxMedia) {
        closeLightbox(isAll);
      }

      return;
    }

    if (clickedCard) {
      if (isAll && !isPaused) {
        document.body.classList.add("is-gallery-paused");
        return;
      }

      openLightbox(clickedCard);
      return;
    }

    if (isAll) {
      document.body.classList.toggle("is-gallery-paused");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("is-lightbox-open")) {
      closeLightbox(true);
    }
  });

  // Filter buttons: All / Academic / Professional.
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
    closeLightbox(true);
    aboutPanel.classList.remove("is-open");
    appsPanel.classList.remove("is-open");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

