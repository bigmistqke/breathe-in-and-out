import {} from '@bigmistqke/view.gl'
import { compile, glsl, uniform } from '@bigmistqke/view.gl/tag'
import clsx from 'clsx'
import { createEffect, onMount, type Component } from 'solid-js'
import { createStore } from 'solid-js/store'
import styles from './App.module.css'
import './index.css'

function TimeControl(props: { value: number; onDecrement(): void; onIncrement(): void }) {
  return (
    <div class={styles.timeControl}>
      <h2 class={styles.timeValue}>{(props.value / 1_000).toFixed(1)}</h2>
      <div class={styles.buttonContainer}>
        <button
          class={clsx(styles.button, props.value <= 500 ? styles.disabled : false)}
          onClick={() => (props.value > 500 ? props.onDecrement() : undefined)}
        >
          &minus;
        </button>
        <button class={styles.button} onClick={props.onIncrement}>
          +
        </button>
      </div>
    </div>
  )
}

const App: Component = () => {
  let canvas: HTMLCanvasElement = null!

  const [config, setConfig] = createStore<{
    in: number
    out: number
    color1: [number, number, number]
    color2: [number, number, number]
  }>({
    in: 3_000,
    out: 5_000,
    color1: [1, 1, 1],
    color2: [0, 0, 0],
  })

  function setup() {
    const gl = canvas.getContext('webgl2', { antialias: true })
    if (!gl)
      throw new Error(
        `Expected canvas.getContext('webgl2') to return WebGL2RenderingContext, but returned null`,
      )

    const fragment = glsl`#version 300 es
precision mediump float;

in vec2 v_uv;
out vec4 outColor;
${uniform.float('u_value')}
${uniform.vec3('u_color1')}
${uniform.vec3('u_color2')}

void main() {
  if(v_uv[1] < u_value){
    outColor = vec4(u_color1, 1.0);
  }else{
    outColor = vec4(u_color2, 1.0);
  }
}`
    const { program, view } = compile.toQuad(gl, fragment, { webgl2: true })

    gl.useProgram(program)

    let previous: number
    let current = 0
    let direction: 1 | -1 = 1

    createEffect(() => view.uniforms.u_color1.set(...config.color1))
    createEffect(() => view.uniforms.u_color2.set(...config.color2))

    function resize() {
      canvas.height = window.innerHeight
      canvas.width = window.innerWidth
      gl?.viewport(0, 0, canvas.width, canvas.height)
    }

    window.addEventListener('resize', resize)
    resize()

    requestAnimationFrame(function render(time) {
      try {
        if (!previous) {
          return
        }

        const delta = time - previous
        const duration = direction === 1 ? config.in : config.out

        if (duration <= 0) {
          return
        }

        current += (delta * direction) / duration

        if (direction > 0) {
          if (current >= 1) {
            direction = -1
          }
        } else {
          if (current <= -1) {
            direction = 1
          }
        }

        view.attributes.a_quad.bind()
        view.uniforms.u_value.set(current)

        gl.drawArrays(gl.TRIANGLES, 0, 6)
      } finally {
        previous = time
        requestAnimationFrame(render)
      }
    })
  }

  onMount(setup)

  return (
    <>
      <div class={styles.ui}>
        <header class={styles.header}>
          <h1>IN</h1>
          <h1>OUT</h1>
        </header>
        <div class={styles.timeControlContainer}>
          <TimeControl
            value={config.in}
            onDecrement={() => setConfig('in', v => v - 500)}
            onIncrement={() => setConfig('in', v => v + 500)}
          />
          <TimeControl
            value={config.out}
            onDecrement={() => setConfig('out', v => v - 500)}
            onIncrement={() => setConfig('out', v => v + 500)}
          />
        </div>
      </div>
      <canvas ref={canvas} class={styles.canvas} />
    </>
  )
}

export default App
