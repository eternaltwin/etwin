# Apache

**⚠** The server uses Nginx instead of Apache. You may still use Apache locally.

## Apache root

- Wamp: `C:\wamp64\bin\apache\apache2.4.41` (the version may differ)
- Xampp: TODO

## Virtual Host

Make sure that virtual host support is enabled in `./conf/httpd.conf`. The
following line should be uncommented:

```
LoadModule vhost_alias_module modules/mod_vhost_alias.so
```

Add the following tag at the end of your `./conf/extra/httpd-vhosts.conf` file.

```xml
<VirtualHost *:80>
  ServerName myproject.localhost
  ServerAlias myproject.localhost
  DocumentRoot "/path/to/project/"
  <Directory "/">
    Require all granted
  </Directory>
</VirtualHost>
```

Replace `myproject.localhost` by your project local domain name (as configured
in your hosts file).

Replace `/path/to/project/` by the absolute path to your project root.
