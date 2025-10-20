document.addEventListener("DOMContentLoaded", () => {
  const downloadBtn = document.getElementById("download-btn");
  const imageContainer = document.getElementById("image-container");
  const settingsBtn = document.getElementById("settings-btn");
  const settingsMenu = document.getElementById("settings-menu");
  const darkThemeToggle = document.getElementById("dark-theme-toggle");
  const nsfwToggle = document.getElementById("nsfw-toggle");

  const fetchCatgirl = async () => {
    imageContainer.innerHTML = "<p>Завантаження...</p>";

    try {
      // Визначаємо URL залежно від режиму NSFW
      const isNsfw = nsfwToggle.checked;
      const category = "neko";
      const type = isNsfw ? "nsfw" : "sfw";
      const apiUrl = `https://api.waifu.pics/${type}/${category}`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`Помилка HTTP: ${response.status}`);
      }

      const data = await response.json();

      // Перевіряємо, чи API повернуло URL
      if (!data.url) {
        imageContainer.innerHTML =
          "<p>Не вдалося знайти зображення. Спробуйте ще раз.</p>";
        return;
      }

      const imageUrl = data.url;

      // Створюємо та відображаємо зображення
      const img = document.createElement("img");
      img.src = imageUrl;
      img.alt = "Catgirl";
      img.style.display = "none"; // Ховаємо зображення до повного завантаження

      img.onload = () => {
        imageContainer.innerHTML = ""; // Очищуємо контейнер від тексту "Завантаження..."
        img.style.display = "block"; // Показуємо зображення
        imageContainer.appendChild(img);
      };

      img.onerror = () => {
        imageContainer.innerHTML =
          "<p>Не вдалося завантажити зображення. Спробуйте інше.</p>";
      };
    } catch (error) {
      console.error("Помилка під час завантаження:", error);
      imageContainer.innerHTML = `<p>Виникла помилка: ${error.message}</p>`;
    }
  };

  // --- Логіка налаштувань ---

  // Відкриття/закриття меню налаштувань
  settingsBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Зупиняємо спливання, щоб не закрити меню одразу
    settingsMenu.classList.toggle("open");
  });

  // Закриття меню при кліку поза ним
  document.addEventListener("click", (e) => {
    if (
      settingsMenu.classList.contains("open") &&
      !settingsMenu.contains(e.target)
    ) {
      settingsMenu.classList.remove("open");
    }
  });

  // --- Темна тема ---
  const applyTheme = (isDark) => {
    if (isDark) {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
  };

  darkThemeToggle.addEventListener("change", () => {
    const isDark = darkThemeToggle.checked;
    localStorage.setItem("darkTheme", isDark);
    applyTheme(isDark);
  });

  // --- NSFW режим ---
  nsfwToggle.addEventListener("change", () => {
    localStorage.setItem("nsfwMode", nsfwToggle.checked);
    fetchCatgirl(); // Оновлюємо картинку одразу
  });

  // --- Ініціалізація ---
  const initialize = () => {
    // Застосовуємо тему
    const savedTheme = localStorage.getItem("darkTheme") === "true";
    darkThemeToggle.checked = savedTheme;
    applyTheme(savedTheme);

    // Встановлюємо перемикач NSFW
    const savedNsfw = localStorage.getItem("nsfwMode") === "true";
    nsfwToggle.checked = savedNsfw;

    // Завантажуємо перше зображення
    fetchCatgirl();
  };

  // Додаємо обробник події для головної кнопки
  downloadBtn.addEventListener("click", fetchCatgirl);

  // Запускаємо ініціалізацію при завантаженні сторінки
  initialize();
});
