/**
 * The Link Message is typically used to send information about an article
 * or other remote contents. Clicking on the Link Message opens that content.
 *
 * A basic Link Message can be created with:
 *
 * ```
 * LinkModel = Layer.Core.Client.getMessageTypeModelClass('LinkModel')
 * model = new LinkModel({
 *    url: "https://layer.com/introducing-the-layer-conversation-design-system/",
 *    title: "Introducing the Layer Conversation Design System",
 *    imageUrl: "https://layer.com/wp-content/uploads/2017/07/bezier-blog-header-2x.png",
 *    description: "The Layer Conversation Design System helps you imagine and design the perfect customer conversation across devices.",
 *    author: "layer.com"
 * });
 * model.send({ conversation });
 * ```
 *
 * All properties except the `url` are optional; if you don't want an image, just leave out the `imageUrl.
 *
 * A Link Message with some tracking can be done using:
 *
 * ```
 * LinkModel = Layer.Core.Client.getMessageTypeModelClass('LinkModel')
 * model = new LinkModel({
 *    url: "https://layer.com/introducing-the-layer-conversation-design-system/",
 *    title: "Introducing the Layer Conversation Design System",
 *    action: {
 *        data: {
 *            url: "https://layer.com/introducing-the-layer-conversation-design-system/?from_my_app"
 *        }
 *     }
 * });
 * model.send({ conversation });
 * ```
 *
 * In the above example, the LinkModel's url will be used if showing a URL.
 * The `action.data.url` if the user clicks on the Message.
 *
 * ### Importing
 *
 * Included with the standard build. For custom build, Import with:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/link/layer-link-message-view';
 * import '@layerhq/web-xdk/ui/messages/link/layer-link-message-model';
 * ```
 *
 * @class Layer.UI.messages.LinkMessageModel
 * @extends Layer.Core.MessageTypeModel
 */
import Core from '../../../core/namespace';
import { xhr } from '../../../utils';

const { MessagePart, MessageTypeModel, Root } = Core;

const TitleRegEx = new RegExp(/<meta [^>]*property\s*=\s*['"]og:title['"].*?\/>/);
const DescriptionRegEx = new RegExp(/<meta [^>]*property\s*=\s*['"]og:description['"].*?\/>/);
const AuthorRegEx = new RegExp(/<meta [^>]*property\s*=\s*['"]og:author['"].*?\/>/);
const ImageRegEx = new RegExp(/<meta [^>]*property\s*=\s*['"]og:image['"].*?\/>/);

class LinkModel extends MessageTypeModel {

  /**
   * Generate all of the Layer.Core.MessagePart needed to represent this Model.
   *
   * Used for Sending the Link Message.
   *
   * @method generateParts
   * @param {Function} callback
   * @param {Layer.Core.MessagePart[]} callback.parts
   * @typescript public
   * @private
   */
  generateParts(callback) {
    const body = this.initBodyWithMetadata(['imageUrl', 'author', 'title', 'description', 'url']);

    this.part = new MessagePart({
      mimeType: this.constructor.MIMEType,
      body: JSON.stringify(body),
    });
    callback([this.part]);
  }

  // Used by Layer.UI.messages.StandardMessageViewContainer
  getFooter() { return this.author; }
  getDescription() { return this.description; }

  /**
   * Before sending a Link Message you may want to load the article and populate this Model's proerties from it.
   *
   * ```
   * LinkModel = Layer.Core.Client.getMessageTypeModelClass('LinkModel')
   * model = new LinkModel({
   *     url: "http://www.cnn.com/2017/11/17/health/dog-owners-heart-disease-and-death/index.html",
   * });
   * model.gatherMetadata(function(isSuccess,resultObj) {
   *    model.send({ conversation });
   * })
   * ```
   *
   * Once the callback is called, the model's properties have been updated and is ready to send.
   * Unless of course `isSuccess` is `false`
   *
   * > *Note*
   * >
   * > The most common cause of failure for this operation is a CORS error; many webservers are
   * > not setup to support this type of request.
   *
   * @method gatherMetadata
   * @param {Function} callback
   * @param {Boolean} callback.isSuccess
   * @param {Object}  callback.result     This is the result object generated by Layer.Core.xhr
   */
  gatherMetadata(callback) {
    xhr({
      method: 'GET',
      url: this.url,
    }, (result) => {
      if (result.success) {
        this.html = result.data;
        if (!this.title) {
          this.title = this._getArticleMeta(TitleRegEx);
          this._triggerAsync('message-type-model:change', {
            property: 'title',
            oldValue: '',
            newValue: this.title,
          });
        }
        if (!this.description) {
          this.description = this._getArticleMeta(DescriptionRegEx);
          this._triggerAsync('message-type-model:change', {
            property: 'description',
            oldValue: '',
            newValue: this.description,
          });
        }
        if (!this.imageUrl) {
          this.imageUrl = this._getArticleMeta(ImageRegEx);
          this._triggerAsync('message-type-model:change', {
            property: 'imageUrl',
            oldValue: '',
            newValue: this.imageUrl,
          });
        }
        if (!this.author) {
          this.author = this._getArticleMeta(AuthorRegEx);
          this._triggerAsync('message-type-model:change', {
            property: 'author',
            oldValue: '',
            newValue: this.author,
          });
        }
      }
      callback(result.success, result);
    });
  }

  /**
   * Parse the article for the requested metadata.
   *
   * @method _getArticleMeta
   * @private
   * @param {RegExp} regex
   * @returns {String}
   */
  _getArticleMeta(regex) {
    const matches = this.html.match(regex);
    if (matches) {
      const metatag = matches[0];
      if (metatag) {
        let contentMatches = metatag.match(/content\s*=\s*"(.*?[^/])"/);
        if (!contentMatches) contentMatches = metatag.match(/content\s*=\s*'(.*?[^/])'/);
        if (contentMatches) return contentMatches[1];
      }
    }
    return '';
  }
}

/**
 * The imageUrl is the url to an image to show within the Link Message View.
 *
 * @property {String} imageUrl
 */
LinkModel.prototype.imageUrl = '';

/**
 * The Author of the document linked to by the Link Message; typically shown in the Message Footer.
 *
 * @property {String} author
 */
LinkModel.prototype.author = '';

/**
 * The title of the document linked to by the Link Message
 *
 * @property {String} title
 */
LinkModel.prototype.title = '';

/**
 * The description of the document linked to by the Link Message
 *
 * @property {String} description
 */
LinkModel.prototype.description = '';

/**
 * The url of the document linked to by the Link Message.
 *
 * By default, this is the url opened when the user clicks on this Message.
 *
 * @property {String} url
 */
LinkModel.prototype.url = '';

/**
 * If calling Layer.UI.messages.LinkMessageModel.gatherMetadata, the article is stored
 * in this html property.
 *
 * Otherwise, this property is empty.
 *
 * @property {String} html
 */
LinkModel.prototype.html = '';

/**
 * Standard concise representation of this Message Type
 *
 * @static
 * @property {String} [SummaryTemplate=${url}]
 */
LinkModel.SummaryTemplate = '${url}'; // eslint-disable-line no-template-curly-in-string

/**
 * One instance of this type
 *
 * @static
 * @property {String} [LabelSingular=Link]
 */
LinkModel.LabelSingular = 'Link';

/**
 * One instance of this type
 *
 * @static
 * @property {String} [LabelPlural=Links]
 */
LinkModel.LabelPlural = 'Links';

/**
 * The default action when selecting this Message is to trigger an `open-url` and view the linked document/site.
 *
 * @static
 * @property {String} [defaultAction=open-url]
 */
LinkModel.defaultAction = 'open-url';

/**
 * The MIME Type recognized by and used by the Link Model.
 *
 * @static
 * @property {String} [MIMEType=application/vnd.layer.link+json]
 */
LinkModel.MIMEType = 'application/vnd.layer.link+json';

/**
 * The UI Component to render the Link Model.
 *
 * @static
 * @property {String} [messageRenderer=layer-link-message-view]
 */
LinkModel.messageRenderer = 'layer-link-message-view';

// Finish setting up the Class
Root.initClass.apply(LinkModel, [LinkModel, 'LinkModel']);

// Register the Card Model Class with the Client
Core.Client.registerMessageTypeModelClass(LinkModel, 'LinkModel');

module.exports = LinkModel;
