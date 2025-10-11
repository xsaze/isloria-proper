export const SPRITE_SHEETS = {
    stag: {
        idle: {
            image: "/assets/animals/stag_idle_32x41.png",
            frameWidth: 32,
            frameHeight: 41,
            cols: 24,
            rows: 4,
            directions: ['NE','NW','SE','SW']
        },
        walk: {
            image: "/assets/animals/stag_walk_32x41.png",
            frameWidth: 32,
            frameHeight: 41,
            cols: 11,
            rows: 4,
            directions: ['NE','NW','SE','SW']
        },
        run: {
            image: "/assets/animals/stag_run_32x41.png",
            frameWidth: 32,
            frameHeight: 41,
            cols: 10,
            rows: 4,
            directions: ['NE','NW','SE','SW']
        }
    },
    boar: {
        idle: {
            image: "/assets/animals/boar_idle_41x32.png",
            frameWidth: 41,
            frameHeight: 32,
            cols: 7,
            rows: 4,
            directions: ['NE','NW','SE','SW']
        },
        run: {
            image: "/assets/animals/boar_run_41x32.png",
            frameWidth: 41,
            frameHeight: 32,
            cols: 4,
            rows: 4,
            directions: ['NE','NW','SE','SW']
        }},
    player: {
        idle: {
            image: "/assets/animals/player_idle_48x48.png",
            frameWidth: 48,
            frameHeight: 48,
            cols: 1,
            rows: 4,
            directions: ['SW','SE','NW','NE']},
        walk: {
            image: "/assets/animals/player_walk_48x48.png",
            frameWidth: 48,
            frameHeight: 48,
            cols: 4,
            rows: 4,
            directions: ['SW','SE','NW','NE']
        }
    },
    wolf: {
        idle: {
            image: "/assets/animals/wolf_idle_64x64.png",
            frameWidth: 64,
            frameHeight: 64,
            cols: 9,
            rows: 4,
            directions: ['SW','SE','NW','NE']},
        walk: {
            image: "/assets/animals/wolf_run_64x64.png",
            frameWidth: 64,
            frameHeight: 64,
            cols: 8,
            rows: 4,
            directions: ['SW','SE','NW','NE']
        }
    },
    // badger: {
    //     idle: {

    //     }
    // }
}