# ── Build stage ──────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy site files
COPY index.html       /usr/share/nginx/html/
COPY style.css        /usr/share/nginx/html/
COPY app.js           /usr/share/nginx/html/
COPY images/          /usr/share/nginx/html/images/

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
