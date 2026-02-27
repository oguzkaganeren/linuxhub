# Maintainer: Your Name <you@example.com>
pkgname=linuxhub
pkgver=0.1.0
pkgrel=1
pkgdesc="A tool providing access to documentation and support for new linux users"
arch=('x86_64')
url="https://github.com/oguzkaganeren/linuxhub"
license=('MIT')
depends=(
    'gtk3'
    'libappindicator-gtk3'
    'libxcb'
    'libxkbcommon'
    'openssl'
    'webkit2gtk-4.1'
)
makedepends=(
    'cargo'
    'npm'
    'typescript'
    'nodejs'
    'base-devel'
)
options=('!lto')
source=("git+https://github.com/oguzkaganeren/linuxhub.git#tag=v${pkgver}"
        "linuxhub.desktop"
        "linuxhub.service")
sha256sums=('SKIP'
            'SKIP'
            'SKIP')

prepare() {
    cd "${pkgname}"
    export RUSTUP_TOOLCHAIN=stable
    cargo fetch --locked --target x86_64-unknown-linux-gnu
    npm ci
}

build() {
    cd "${pkgname}"
    
    # Build frontend
    npm run build
    
    # Build Tauri app (bundles frontend + backend)
    npm run tauri build -- --target x86_64-unknown-linux-gnu
}

package() {
    cd "${pkgname}"
    
    # Install the binary
    install -Dm755 "src-tauri/target/x86_64-unknown-linux-gnu/release/linuxhub" \
        "${pkgdir}/usr/bin/linuxhub"
    
    # Install desktop file
    install -Dm644 "${srcdir}/linuxhub.desktop" \
        "${pkgdir}/usr/share/applications/linuxhub.desktop"
    
    # Install systemd service (optional)
    install -Dm644 "${srcdir}/linuxhub.service" \
        "${pkgdir}/usr/lib/systemd/user/linuxhub.service"
    
    # Install icon if available in project
    if [ -f "public/icon.png" ]; then
        install -Dm644 "public/icon.png" \
            "${pkgdir}/usr/share/pixmaps/linuxhub.png"
    fi
    
    # Install license
    if [ -f "LICENSE.md" ]; then
        install -Dm644 "LICENSE.md" \
            "${pkgdir}/usr/share/licenses/linuxhub/LICENSE.md"
    fi
}
