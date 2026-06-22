FROM php:8.4-fpm

ARG UID=1000
ARG GID=1000

RUN groupadd --gid ${GID} appuser \
    && useradd --uid ${UID} --gid ${GID} --create-home --shell /bin/bash appuser

RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libicu-dev \
    libonig-dev \
    libxml2-dev \
    curl \
    unzip \
    git \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_pgsql \
        pgsql \
        gd \
        intl \
        bcmath \
        opcache \
        zip \
        mbstring \
        xml \
        pcntl

RUN pecl install redis && docker-php-ext-enable redis

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY docker/php/php.ini /usr/local/etc/php/conf.d/app.ini

RUN mkdir -p /var/www/html/storage /var/www/html/bootstrap/cache \
    && chown -R appuser:appuser /var/www

USER appuser

WORKDIR /var/www/html

EXPOSE 9000
