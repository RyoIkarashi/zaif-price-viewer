# zaif-price-viewer
A tiny [zaif](https://zaif.jp) price viewer for [bitbar](https://getbitbar.com/)

## Installation

```bash
# move to a bitbar plugin directory
cd /path/to/bitbar-plugin-directory/
# download the source
git clone https://github.com/RyoIkarashi/zaif-price-viewer.git
# move to the directory and install node moduels
( cd zaif-price-viewer && yarn install )
# add a symlink to (make sure you're in a bitbar plugin directory)
ln -s ./zaif-price-viewer/zaif.10s.js
```

## Add your own `access_key` and `secret_key`

Edit `env.json` and replace `<YOUR_ACCESS_KEY>` and `<YOUR_ACCESS_SECRET_KEY>` with yours.

## Screenshot
![screenshot](https://user-images.githubusercontent.com/5750408/32333718-ec1d99e6-c02b-11e7-8990-c26f6629a1df.png)


## License
MIT

If you feel this little tool gives you some value, tips are always welcome at the following addresses!
- Bitcoin: 1DrLPjzmNHtkdBstd82xvCxGY38PnKauRH
- Mona:    MC7XMmi1YXoJH19D1q4H8ijBkdvarWBTMi
