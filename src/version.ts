// This file exports the version from package.json for use in the app
import packageJson from "../package.json";

export const APP_VERSION = packageJson.version;
export const APP_NAME = packageJson.name;
export const APP_DESCRIPTION = packageJson.description;
export const APP_AUTHOR = packageJson.author;
