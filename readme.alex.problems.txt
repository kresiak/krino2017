ca a été très pénible de faire marcher Krino chez Krzystof.... le npm install qui avait encore marché chez Philippe, ne marchait plus
la raison est que les ^ et les ~ dans package.json lui ont donné des versions plus récentes d'angular et angular-cli qui ont posé des problèmes
en enlevant ces ^ et ~pour ces entrées en en fixant angular-cli à la version 1.6.5 ca a marché.  1.6.4 avait un problème avec webkit et 1.7.2 créait un problème avec l'affichage d'images dans Krino
