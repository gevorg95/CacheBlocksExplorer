var MapViewer = function (app, container) {
  var self = this

  this.maxCellSize = 10
  this.minCellSize = 5
  this.cellSize = 0

  this.app = app
  this.canvas = $(container).get(0)
  this.context = null
  this.image = null
  this.colors = []

  this.legendBlock = $('.mapWrapper .mapLegend')

  this.init()
  return this
}

MapViewer.prototype.init = function () {

  this.context = this.canvas.getContext('2d')

  this.initWS()
}

MapViewer.prototype.initWS = function () {
  var self = this
  var wsUrl = ((window.location.protocol == "https:") ? "wss:" : "ws:" + "//" + window.location.host)
  wsUrl += '/blocks/Blocks.WebSocket.cls'
  this.ws = new WebSocket(wsUrl)

  this.ws.onopen = function () {}

  this.ws.onclose = function () {}

  this.ws.onmessage = function () {
    self.wsmessage.apply(self, arguments)
  }
}

MapViewer.prototype.wsmessage = function (event) {
  var self = this
  try {
    var data = JSON.parse(event.data)
    var cols = this.image.width / this.cellSize
    $.each(data, function (i, glob) {
        var globalName = '^' + glob.global
        var colors = self.colors[globalName] || null
        if (colors !== null) {
          $.each(glob.blocks, function (j, block) {
            x = block % cols
            x = x === 0 ? cols : x
            y = Math.ceil(block / cols)
            // console.log(block, x, y, cols, self.cellSize)
            self.context.fillStyle = 'rgba(' + colors[0] + ',' + colors[1] + ',' + colors[2] + ',' + 255 + ')'
            self.context.fillRect((x - 1) * self.cellSize, (y - 1) * self.cellSize, self.cellSize, self.cellSize)
            self.context.strokeRect((x - 1) * self.cellSize, (y - 1) * self.cellSize, self.cellSize, self.cellSize)
          })
        }
      })
      // this.context.putImageData(this.image, 0, 0)
  } catch (ex) {

  }
}

MapViewer.prototype.reset = function () {
  this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  this.image = null
  this.legendBlock.empty()
}

MapViewer.prototype.get = function (directory, blocks) {
  var self = this
  this.reset()
  this.app.load('rest/block/3', {
    directory: directory
  }, function (blockData) {
    self.initImage(blocks)
    self.initColors(blockData.nodes)
    self.ws.send('getblocks\x01' + directory)
  })
}

MapViewer.prototype.initImage = function (blocks) {
  var cols = Math.ceil(Math.sqrt(blocks))
  var canvasWidth = $(this.canvas).width()
  if ((canvasWidth / cols) > 20) {
    cols = Math.ceil(canvasWidth / 20)
  } else if ((canvasWidth / cols) < 5) {
    cols = Math.ceil(canvasWidth / 5)
  }
  this.cellSize = Math.ceil(canvasWidth / cols)
  var rows = Math.ceil(blocks / cols)
  var width = cols * this.cellSize
  var height = rows * this.cellSize

  this.image = this.context.createImageData(width, height)
  this.canvas.width = width
  this.canvas.height = height

  for (var x = 0; x <= width; x += this.cellSize) {
    this.context.moveTo(x, 0)
    this.context.lineTo(x, height)
  }

  for (var x = 0; x <= height; x += this.cellSize) {
    this.context.moveTo(0, x)
    this.context.lineTo(width, x)
  }

  this.context.strokeStyle = "rgba(222, 222, 222, 255)"
  this.context.stroke()
  this.image = this.context.getImageData(0, 0, width, height)
}

MapViewer.prototype.initColors = function (globals) {
  var self = this
  var maxCount = globals.length
  $.each(globals, function (i, node) {
    var ksi = i / maxCount
    var c_red, c_blue, c_green
    if (ksi < 0.5) {
      c_red = ksi * 2
      c_blue = (0.5 - ksi) * 2
    } else {
      c_red = (1.0 - ksi) * 2
      c_blue = (ksi - 0.5) * 2
    }

    if (ksi >= 0.3 && ksi < 0.8) {
      c_green = (ksi - 0.3) * 2
    } else if (ksi < 0.3) {
      c_green = (0.3 - ksi) * 2
    } else {
      c_green = (1.3 - ksi) * 2
    }

    c_red = Math.trunc(c_red * 256)
    c_green = Math.trunc(c_green * 256)
    c_blue = Math.trunc(c_blue * 256)
    var globalName = node.print
    self.colors[globalName] = [c_red, c_green, c_blue]
    $('<div>')
      .text(globalName)
      .append(
        $('<span>')
        .css('background-color', 'rgb(' + c_red + ', ' + c_green + ', ' + c_blue + ')')
      )
      .appendTo(self.legendBlock)
  })
}
