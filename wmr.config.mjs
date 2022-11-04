import { defineConfig } from 'wmr';
import postcss from 'rollup-plugin-postcss'

// Full list of options: https://wmr.dev/docs/configuration
export default defineConfig({
	/* Your configuration here */
	alias: {
		react: 'preact/compat',
        'react-dom': 'preact/compat',
        'src/*': 'src'
    },
    // plugins: [, 
    //     postcss({
    //         preprocessor: (content, id) => new Promise((resolve, reject) => {
    //           const result = sass.renderSync({ file: id })
    //           resolve({ code: result.css.toString() })
    //         }),
    //         sourceMap: true,
    //         extensions: ['.sass','.css'],
    //         extract: "plum.css",
    //       }),
    // ]
});
