document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select to avoid duplicate options on refresh
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // helper: extract initials from an email/name
      function getInitials(text) {
        if (!text) return "";
        const base = text.split("@")[0].replace(/[^a-zA-Z0-9.\-_ ]/g, "");
        const parts = base.split(/[\s.\-_]+/).filter(Boolean);
        if (parts.length === 0) return "";
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>

          <div class="participants-section">
            <h5 class="participants-title">Participants</h5>
            <ul class="participants-list"></ul>
          </div>
        `;

        // Build participants list
        const participantsList = activityCard.querySelector(".participants-list");
        if (!details.participants || details.participants.length === 0) {
          const li = document.createElement("li");
          li.className = "participant-item no-participants";
          li.textContent = "No participants yet";
          participantsList.appendChild(li);
        } else {
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const avatar = document.createElement("span");
            avatar.className = "participant-avatar";
            avatar.textContent = getInitials(p);

            const nameSpan = document.createElement("span");
            nameSpan.className = "participant-name";
            nameSpan.textContent = p;

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "participant-delete";
            deleteBtn.title = "Unregister participant";
            deleteBtn.innerHTML = "&#x2716;";

            // Unregister handler
            deleteBtn.addEventListener("click", async (evt) => {
              evt.stopPropagation();
              try {
                const res = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(p)}`,
                  { method: "DELETE" }
                );

                const result = await res.json().catch(() => ({}));
                if (res.ok) {
                  // refresh full activities view to keep counts in sync
                  fetchActivities();
                } else {
                  console.error("Failed to unregister:", result.detail || result.message || res.statusText);
                }
              } catch (err) {
                console.error("Error unregistering participant:", err);
              }
            });

            li.appendChild(avatar);
            li.appendChild(nameSpan);
            li.appendChild(deleteBtn);
            participantsList.appendChild(li);
          });
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        // refresh activities to show new participant without manual reload
        fetchActivities();
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
