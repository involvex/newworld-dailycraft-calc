# Project: New World Crafting Calculator

## Project Overview

This project is a comprehensive crafting calculator for the Amazon's New World MMO. It's built as a React and TypeScript web application, enhanced with an Electron wrapper to provide desktop-specific features such as advanced OCR for inventory detection, customizable global hotkeys, and system tray integration. The application utilizes Vite for its build system and Tailwind CSS for styling.

## Building and Running

To set up and run the project locally, follow these steps:

1.  **Install Dependencies:**

    ```bash
    npm install
    ```

2.  **Development Commands:**
    - **Start Web Development Server:**
      ```bash
      npm run dev
      ```
    - **Start Electron App in Development Mode:**
      ```bash
      npm run electron-dev
      ```

3.  **Build Commands:**
    - **Build Web Version:**
      ```bash
      npm run build
      ```
    - **Build Electron App (Production):**
      ```bash
      npm run dist
      ```
    - **Build All (Web and Electron):**
      ```bash
      npm run build-all
      ```

## Development Conventions

The project adheres to the following development conventions:

- **Language:** TypeScript
- **Framework:** React
- **Styling:** Tailwind CSS
- **Linting:** ESLint (configured via `eslint.config.mjs`)
- **Formatting:** Prettier (configured via `.prettierrc.yaml`)

## Project Structure

- `src/`: Contains React components and styles.
- `data/`: Stores game-related data such as items and recipes.
- `services/`: Houses configuration and various utility services.
- `hooks/`: Custom React hooks for reusable logic.
- `components/`: Reusable UI components.
- `electron.js`: The main process file for the Electron application.
- `preload.js`: A script that runs before other scripts in the Electron renderer process, providing a secure bridge to Node.js environments.
- `docs/`: Contains project documentation and GitHub Pages related files.
