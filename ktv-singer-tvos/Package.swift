// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "KTVSinger",
    platforms: [
        .iOS(.v17),
        .tvOS(.v17)
    ],
    products: [
        .library(
            name: "KTVSingerShared",
            targets: ["KTVSingerShared"]
        ),
    ],
    dependencies: [
        // Supabase Swift SDK
        .package(url: "https://github.com/supabase/supabase-swift.git", from: "2.0.0"),
    ],
    targets: [
        .target(
            name: "KTVSingerShared",
            dependencies: [
                .product(name: "Supabase", package: "supabase-swift"),
            ],
            path: "Shared"
        ),
        .testTarget(
            name: "KTVSingerSharedTests",
            dependencies: ["KTVSingerShared"]
        ),
    ]
)
