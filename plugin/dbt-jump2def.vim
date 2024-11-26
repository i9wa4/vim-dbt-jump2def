if exists('g:loaded_dbt_jump2def')
  finish
endif
let g:loaded_dbt_jump2def = 1

augroup dbt-jump2def
  autocmd!
  autocmd User DenopsPluginPost:dbt-jump2def call denops#notify('dbt-jump2def', 'init', [])
augroup END
