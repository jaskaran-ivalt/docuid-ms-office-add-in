import React from "react";
import { Stack, Text } from "@fluentui/react";
import "./AppDownloadButtons.css";

const AppDownloadButtons: React.FC = () => {
  return (
    <Stack
      horizontalAlign="center"
      tokens={{ childrenGap: 12 }}
      styles={{ root: { padding: "16px 0" } }}
    >
      <a
        target="_blank"
        rel="noopener noreferrer"
        href="https://play.google.com/store/apps/details?id=com.abisyscorp.ivalt&hl=en_IN&pli=1"
        className="app-download-button android"
      >
        <svg fill="#fff" viewBox="0 0 1920 1920" className="app-icon" xmlns="http://www.w3.org/2000/svg">
          <path d="M1306.086 25.225c17.167-25.976 52.29-33.091 78.267-15.698 25.976 17.28 32.978 52.29 15.698 78.266l-85.72 128.637c29.25 18.861 57.372 39.416 83.122 62.907 118.473 108.648 183.752 253.435 183.752 407.71v734.102c0 88.318-76.008 160.034-169.408 160.034h-169.409V1920H1129.45v-338.817H790.633V1920H677.694v-338.817H508.286c-93.4 0-169.408-71.716-169.408-160.034V709.296c0-200.58 107.292-380.266 269.246-488.913L519.58 87.906c-17.393-25.976-10.39-60.987 15.472-78.38 25.863-17.28 60.987-10.277 78.38 15.586l94.304 141.06c59.858-25.862 123.78-44.61 191.883-50.596 109.325-9.6 216.956 7.906 314.083 48.112ZM225.939 734.142v564.694H113V734.142h112.939Zm1581.144 0v564.694h-112.94V734.142h112.94Zm-621.164-282.347c-62.23 0-112.939 50.71-112.939 112.939 0 62.23 50.71 112.939 112.939 112.939 62.23 0 112.939-50.71 112.939-112.94 0-62.228-50.71-112.938-112.939-112.938Zm-451.755 0c-62.23 0-112.94 50.71-112.94 112.939 0 62.23 50.71 112.939 112.94 112.939 62.229 0 112.938-50.71 112.938-112.94 0-62.228-50.71-112.938-112.938-112.938Z" fillRule="evenodd"></path>
        </svg>
        <span className="app-button-text">
          <span className="app-button-title">Android</span>
          <p className="app-button-subtitle">Get it on Google Play</p>
        </span>
      </a>

      <a
        target="_blank"
        rel="noopener noreferrer"
        href="https://apps.apple.com/in/app/ivalt/id1507945806"
        className="app-download-button ios"
      >
        <svg fill="#fff" className="app-icon" version="1.1" viewBox="0 0 22.773 22.773" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.769,0c0.053,0,0.106,0,0.162,0c0.13,1.606-0.483,2.806-1.228,3.675c-0.731,0.863-1.732,1.7-3.351,1.573 c-0.108-1.583,0.506-2.694,1.25-3.561C13.292,0.879,14.557,0.16,15.769,0z"></path>
          <path d="M20.67,16.716c0,0.016,0,0.03,0,0.045c-0.455,1.378-1.104,2.559-1.896,3.655c-0.723,0.995-1.609,2.334-3.191,2.334 c-1.367,0-2.275-0.879-3.676-0.903c-1.482-0.024-2.297,0.735-3.652,0.926c-0.155,0-0.31,0-0.462,0 c-0.995-0.144-1.798-0.932-2.383-1.642c-1.725-2.098-3.058-4.808-3.306-8.276c0-0.34,0-0.679,0-1.019 c0.105-2.482,1.311-4.5,2.914-5.478c0.846-0.52,2.009-0.963,3.304-0.765c0.555,0.086,1.122,0.276,1.619,0.464 c0.471,0.181,1.06,0.502,1.618,0.485c0.378-0.011,0.754-0.208,1.135-0.347c1.116-0.403,2.21-0.865,3.652-0.648 c1.733,0.262,2.963,1.032,3.723,2.22c-1.466,0.933-2.625,2.339-2.427,4.74C17.818,14.688,19.086,15.964,20.67,16.716z"></path>
        </svg>
        <span className="app-button-text">
          <span className="app-button-title">iOS</span>
          <p className="app-button-subtitle">Get it on the App Store</p>
        </span>
      </a>

    </Stack>
  );
};

export default AppDownloadButtons;
