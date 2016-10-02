# atom-bem-create package

Atom plugin for [bem-tools-create](https://github.com/bem-contrib/bem-tools-create).

## How to use

To create a BEM entity of the line or press the key combination BEMJSON `shift-cmd-C`

To open a modal window to enter entity and technologies available keystroke `shift-alt-cmd-C`
or the corresponding item in the context menu

For example, `b1__elem1` or `{ block: 'b1', elem: 'e1' }` will create following folders and files
```
b1/
    __elem1/
        b1__elem1.css
        b1__elem1.js
```
To enter from the context menu to specify supported technologies
For example `b1. {Js, css, test, deps}` will create a folder for the block `b1` in the technologies listed in the` {} `

Atom плагин для [bem-tools-create](https://github.com/bem-contrib/bem-tools-create).

## Как использовать

Для создания БЭМ сущности из строки или BEMJSON нажмите комбинацию клавиш `shift-cmd-C`

Для открытия модального окна для ввода сущности и технологий доступна комбинация клавиш `shift-alt-cmd-C`
или соответствующий пункт в контекстном меню

Например `b1__elem1` или `{ block: 'b1', elem: 'e1' }` создаст папку и файлы для соответсвующей БЭМ сущности
```
b1/
    __elem1/
        b1__elem1.css
        b1__elem1.js
```

Для ввода из контекстного меню поддерживается указание технологий
Например `b1.{js,css,test,deps}` создаст папку для блока `b1` в технологиях перечисленных в `{}`


### Contributors

```
{
  "email": "anyatyu@yandex-team.ru",
  "name": "Anna Tyutyunnik"
},
{
  "email": "invntrm@yandex-team.ru",
  "name": "Alexander Mekhonoshin"
}
```
