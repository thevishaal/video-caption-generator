# 🚀 Important Instructions for Frontend Team

1. First, open the terminal inside the **frontend folder**.

2. If a `.venv` (virtual environment) is active, **deactivate it** before starting:

   ```bash
   deactivate
   ```

3. Create a new branch for frontend setup:

   ```bash
   git checkout -b feat/ui
   ```

4. Complete the **entire frontend project setup** on this branch.

5. Once setup is done, **inform the second developer**.

6. The second developer should:

   * Create a new branch from the **same frontend setup branch (feat/ui)**
   * Use naming like:

     ```bash
     git checkout -b feat/your-feature-name
     ```

7. All future frontend features should be created **from the setup branch**, not directly from main.

---

## ✅ Summary

* Work starts in `frontend/` folder
* Deactivate `.venv` if active
* First branch: `feat/ui`
* Other features: `feat/*` (created from `feat/ui`)
* Do NOT work directly on main branch ❌

---

💻 Follow this workflow to avoid conflicts and keep the project clean.
