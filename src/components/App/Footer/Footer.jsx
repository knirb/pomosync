import React, { useState } from "react";
import * as styles from "styles/Footer/Footer.module.scss";
import GitHubIcon from "@material-ui/icons/GitHub";
import FavoriteIcon from "@material-ui/icons/Favorite";
import { Fade } from "@material-ui/core";

const Footer = () => {
  const [show, setShow] = useState({
    donate: false,
    git: false,
  });
  return (
    <div className={styles.footer}>
      <div>
        <span>
          <Fade in={show["donate"]}>
            <span className={styles.textSpan}>Support Pomosync servers ➤</span>
          </Fade>

          <a href="https://www.paypal.com/donate/?business=6A9FQDLJQHGZY&item_name=Help+keep+the+pomosync+servers+alive%21&currency_code=SEK">
            <FavoriteIcon
              onMouseEnter={() =>
                setShow((show) => {
                  return { ...show, donate: true };
                })
              }
              onMouseLeave={() =>
                setShow((show) => {
                  return { ...show, donate: false };
                })
              }
              className={`${styles.icon} ${styles.heartIcon}`}
            />
          </a>
        </span>
        <span>
          <a href="https://github.com/knirb/pomosync">
            <GitHubIcon
              fontSize="large"
              color="primary"
              className={`${styles.icon} ${styles.gitIcon}`}
            />
          </a>
        </span>
      </div>
    </div>
  );
};

export default Footer;
