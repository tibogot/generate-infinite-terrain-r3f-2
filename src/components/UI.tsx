export default function UI() {
  return (
    <div className="ui">
      <input type="text" className="keyboard-input" />
      <div className="controls">
        <div className="group">
          <div className="element">
            <div className="keys is-arrows">
              <div className="key">A</div>
              <div className="key">S</div>
              <div className="key">D</div>
              <div className="key">W</div>
            </div>
            move
          </div>
          <div className="element show-keyboard-wrapper">
            <button className="show-keyboard">
              <div className="keys">
                <div className="key">⌨</div>
              </div>
              keyboard
            </button>
          </div>
          <div className="element">
            <div className="keys">
              <div className="key">F</div>
            </div>
            fullscreen
          </div>
          <div className="element">
            <div className="keys">
              <div className="key">P</div>
            </div>
            pointer lock
          </div>
          <div className="element">
            <div className="keys">
              <div className="key">V</div>
            </div>
            view mode
          </div>
          <div className="element">
            <div className="keys">
              <div className="key">B</div>
            </div>
            debug
          </div>
        </div>
        <div className="group">
          Infinite procedurally generated world — <a href="https://github.com/ibra-kdbra/Generate_infinite" target="_blank">GitHub</a>
        </div>
      </div>
    </div>
  )
}

